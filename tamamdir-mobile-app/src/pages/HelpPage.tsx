import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

const faqs = [
  {
    q: "Hizmet nasıl talep ederim?",
    a: "Hizmetler sayfasından ilgilendiğiniz hizmeti seçin ve sağlayıcıyla mesajlaşarak talep oluşturun.",
  },
  {
    q: "Hizmet nasıl eklerim?",
    a: "Profil > Hizmet Yönetimi > Yeni Ekle adımlarını izleyerek ilanınızı oluşturabilirsiniz.",
  },
  {
    q: "E-postamı nasıl doğrularım?",
    a: "Kayıt sonrası e-postanıza gelen 6 haneli kodu doğrulama ekranına girin.",
  },
  {
    q: "Destek ekibine nasıl ulaşırım?",
    a: "Sorunlarınız için takım e-postasına yazabilir veya proje GitHub sayfasından issue açabilirsiniz.",
  },
];

export default function HelpPage() {
  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <TopBar showBack title="Yardım Merkezi" />
      <main className="pt-20 px-margin-mobile pb-24 space-y-4">
        <p className="text-on-surface-variant text-sm">
          Tamamdır kullanımı hakkında sık sorulan sorular ve destek bilgileri.
        </p>
        {faqs.map((item) => (
          <div key={item.q} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4">
            <h2 className="font-bold text-sm text-on-surface mb-2">{item.q}</h2>
            <p className="text-sm text-on-surface-variant">{item.a}</p>
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
