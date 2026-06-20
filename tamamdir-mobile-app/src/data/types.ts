export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  avatar: string;
  verified: boolean;
  rating: number;
  completedServices: number;
  activeServices: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  priceNum: number;
  category: string;
  providerId: string;
  providerName: string;
  providerDepartment: string;
  providerAvatar: string;
  providerVerified: boolean;
  rating: number;
  reviewCount: number;
  orderCount: number;
  priceUnit: string;
  coverImageId?: string;
  image: string;
  tags: string[];
  deliveryDays: number;
  location: string;
  status?: "active" | "paused" | "draft";
}

export interface Review {
  id: string;
  serviceId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
  messages: Message[];
}

export interface ServiceHistory {
  id: string;
  serviceTitle: string;
  amount: string;
  partnerName: string;
  partnerAvatar: string;
  status: "completed" | "pending" | "cancelled";
  date: string;
  type: "requested" | "provided";
}
