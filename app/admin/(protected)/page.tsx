<<<<<<< HEAD
import {
  getTransactions,
  getProducts,
  getNews,
  getAds,
  getPayments,
  getSiteSettings,
} from "@/app/actions";
=======
import { getTransactions, getProducts, getNews, getAds, getPayments } from "@/app/actions";
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
import AccountPanel from "./account-panel";
import TransactionsPanel from "./transactions-panel";
import ProductsPanel from "./products-panel";
import NewsPanel from "./news-panel";
import AdsPanel from "./ads-panel";
import PaymentsPanel from "./payments-panel";
<<<<<<< HEAD
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
=======

export default async function Admin() {
  const [transactions, products, news, ads, payments] = await Promise.all([
    getTransactions(),
    getProducts(),
    getNews(),
    getAds(),
    getPayments(),
  ]);
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162

  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold">لوحة التحكم</h1>
        <p className="text-sm opacity-60 mt-0.5">إدارة المكتبة بالكامل من هنا</p>
      </div>

      <AccountPanel />
<<<<<<< HEAD
      <SalesPanel />
      <VisitsPanel />
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
      <PaymentsPanel payments={payments} />
      <TransactionsPanel transactions={transactions} />
      <ProductsPanel products={products} />
      <NewsPanel news={news} />
      <AdsPanel ads={ads} />
<<<<<<< HEAD
      <HomepagePanel
        homeSections={siteSettings.homeSections}
        tiktokUrl={siteSettings.tiktokUrl}
        instagramUrl={siteSettings.instagramUrl}
        telegramUrl={siteSettings.telegramUrl}
        footerText={siteSettings.footerText}
      />
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
    </main>
  );
}
