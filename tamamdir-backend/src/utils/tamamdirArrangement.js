const { run, get } = require('../config/database');

function getBuyerId(conv, providerId) {
  return providerId === conv.participant_a ? conv.participant_b : conv.participant_a;
}

async function getArrangement(conversationId, serviceId) {
  let row = await get(
    'SELECT * FROM conversation_service_arrangements WHERE conversation_id = ? AND service_id = ?',
    [conversationId, serviceId]
  );

  if (!row) {
    return {
      cancel_count: 0,
      customer_cancel_count: 0,
      provider_cancel_count: 0,
      banned_until: null,
      banned_user_id: null,
    };
  }

  row.customer_cancel_count = row.customer_cancel_count ?? row.cancel_count ?? 0;
  row.provider_cancel_count = row.provider_cancel_count ?? 0;

  if (row.banned_until && new Date(row.banned_until) <= new Date()) {
    await run(
      `UPDATE conversation_service_arrangements
       SET cancel_count = 0,
           customer_cancel_count = 0,
           provider_cancel_count = 0,
           banned_until = NULL,
           banned_user_id = NULL,
           updated_at = NOW()
       WHERE conversation_id = ? AND service_id = ?`,
      [conversationId, serviceId]
    );
    return {
      cancel_count: 0,
      customer_cancel_count: 0,
      provider_cancel_count: 0,
      banned_until: null,
      banned_user_id: null,
    };
  }

  return row;
}

function buildArrangementMeta(arrangement, buyerId, providerId, userId) {
  const TAMAMDIR_CANCEL_LIMIT = 2;
  const customerCancels = arrangement.customer_cancel_count ?? arrangement.cancel_count ?? 0;
  const providerCancels = arrangement.provider_cancel_count ?? 0;
  const isCustomer = userId === buyerId;
  const isBanned =
    arrangement.banned_until != null &&
    arrangement.banned_user_id != null &&
    new Date(arrangement.banned_until) > new Date();

  return {
    cancel_count: customerCancels,
    customer_cancel_count: customerCancels,
    provider_cancel_count: providerCancels,
    cancel_limit: TAMAMDIR_CANCEL_LIMIT,
    is_customer: isCustomer,
    my_cancel_count: isCustomer ? customerCancels : providerCancels,
    my_cancels_remaining: isCustomer
      ? Math.max(0, TAMAMDIR_CANCEL_LIMIT - customerCancels)
      : null,
    will_be_banned_if_cancel: isCustomer && customerCancels >= TAMAMDIR_CANCEL_LIMIT - 1,
    is_banned: isBanned,
    banned_until: isBanned ? arrangement.banned_until : null,
    banned_user_id: isBanned ? arrangement.banned_user_id : null,
    i_am_banned: isBanned && arrangement.banned_user_id === userId,
    can_unban: isBanned && userId === providerId && arrangement.banned_user_id === buyerId,
    buyer_id: buyerId,
    provider_id: providerId,
  };
}

async function bothReviewsSubmitted(orderId) {
  const serviceReview = await get('SELECT id FROM reviews WHERE order_id = ?', [orderId]);
  const customerReview = await get('SELECT id FROM user_reviews WHERE order_id = ?', [orderId]);
  return !!serviceReview && !!customerReview;
}

async function findConversation(buyerId, providerId, serviceId = null) {
  const [a, b] = [buyerId, providerId].sort();
  if (serviceId) {
    return get(
      `SELECT * FROM conversations
       WHERE participant_a = ? AND participant_b = ? AND service_id = ?`,
      [a, b, serviceId]
    );
  }
  return get(
    `SELECT * FROM conversations
     WHERE participant_a = ? AND participant_b = ? AND service_id IS NULL`,
    [a, b]
  );
}

async function resetTamamdirConfirms(conversationId, serviceId) {
  await run(
    'DELETE FROM conversation_tamamdir WHERE conversation_id = ? AND service_id = ?',
    [conversationId, serviceId]
  );
}

async function getOrderReviewMeta(orderId, userId, buyerId, bothConfirmed) {
  if (!bothConfirmed || !orderId) {
    return {
      my_review_submitted: false,
      other_review_submitted: false,
      can_leave_review: false,
      both_reviews_submitted: false,
    };
  }

  const serviceReview = await get('SELECT id FROM reviews WHERE order_id = ?', [orderId]);
  const customerReview = await get('SELECT id FROM user_reviews WHERE order_id = ?', [orderId]);
  const isCustomer = userId === buyerId;
  const mySubmitted = isCustomer ? !!serviceReview : !!customerReview;
  const otherSubmitted = isCustomer ? !!customerReview : !!serviceReview;
  const bothSubmitted = !!serviceReview && !!customerReview;

  return {
    my_review_submitted: mySubmitted,
    other_review_submitted: otherSubmitted,
    can_leave_review: !mySubmitted,
    both_reviews_submitted: bothSubmitted,
  };
}

async function buildTamamdirPayload(base, arrangement, buyerId, providerId, userId) {
  const meta = buildArrangementMeta(arrangement, buyerId, providerId, userId);
  const reviewMeta = await getOrderReviewMeta(
    base.order_id,
    userId,
    buyerId,
    base.both_confirmed
  );
  return { ...base, ...meta, ...reviewMeta };
}

async function maybeResetTamamdirAfterBothReviews(conversationId, serviceId, orderId) {
  if (!orderId || !await bothReviewsSubmitted(orderId)) return false;
  await resetTamamdirConfirms(conversationId, serviceId);
  return true;
}

async function completeArrangementCycleIfBothReviewed(req, order) {
  if (!await bothReviewsSubmitted(order.id)) {
    return { both_reviews_submitted: false };
  }

  const conv = await findConversation(order.buyer_id, order.provider_id, order.service_id);
  if (!conv) return { both_reviews_submitted: true };

  await resetTamamdirConfirms(conv.id, order.service_id);

  const service = await get(
    'SELECT id, provider_id, title FROM services WHERE id = ?',
    [order.service_id]
  );
  if (!service) return { both_reviews_submitted: true };

  const buyerId = getBuyerId(conv, service.provider_id);
  const arrangement = await getArrangement(conv.id, order.service_id);
  const payload = await buildTamamdirPayload({
    conversation_id: conv.id,
    service_id: order.service_id,
    service_title: service.title,
    confirmed_user_ids: [],
    both_confirmed: false,
    order_id: null,
    order_status: null,
  }, arrangement, buyerId, service.provider_id, req.user.id);

  const io = req.app.get('io');
  if (io) {
    io.to(`conv:${conv.id}`).emit('tamamdir:update', payload);
  }

  return { both_reviews_submitted: true, tamamdir_reset: true };
}

module.exports = {
  getBuyerId,
  getArrangement,
  buildArrangementMeta,
  buildTamamdirPayload,
  getOrderReviewMeta,
  bothReviewsSubmitted,
  findConversation,
  resetTamamdirConfirms,
  maybeResetTamamdirAfterBothReviews,
  completeArrangementCycleIfBothReviewed,
};
