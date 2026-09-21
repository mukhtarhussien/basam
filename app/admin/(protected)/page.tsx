import {
  getTransactions,
  getProducts,
  getNews,
  getAds,
  getPayments,
  getSiteSettings,
} from "@/app/actions";
import AccountPanel from "./account-panel";
import TransactionsPanel from "./transactions-panel";
import ProductsPanel from "./products-panel";
import NewsPanel from "./news-panel";
import AdsPanel from "./ads-panel";
import PaymentsPanel from "./payments-panel";
import SalesPanel from "./sales-panel";
import VisitsPanel from "./visits-panel";
import HomepagePanel from "./homepage-panel";

export default async function Admin() {
  const [transactions, products, news, ads, payments, siteSettings] =
    await Promise.all([
      getTransactions(),
      getProducts(),
      getNews(),
      getAds(),
      getPayments(),
      getSiteSettings(),
    ]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold">لوحة التحكم</h1>
        <p className="text-sm opacity-60 mt-0.5">إدارة المكتبة بالكامل من هنا</p>
      </div>

      <AccountPanel />
      <SalesPanel />
      <VisitsPanel />
      <PaymentsPanel payments={payments} />
      <TransactionsPanel transactions={transactions} />
      <ProductsPanel products={products} />
      <NewsPanel news={news} />
      <AdsPanel ads={ads} />
      <HomepagePanel
        homeSections={siteSettings.homeSections}
        tiktokUrl={siteSettings.tiktokUrl}
        instagramUrl={siteSettings.instagramUrl}
        telegramUrl={siteSettings.telegramUrl}
        footerText={siteSettings.footerText}
      />
    </main>
  );
}
