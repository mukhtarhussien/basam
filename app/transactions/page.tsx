import TransactionForm from "./transaction-form";

export default function Transactions() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">تقديم معاملة</h1>
        <p className="text-sm opacity-60 mt-0.5">عبّي البيانات وراح نتابعها لك</p>
      </div>

      <TransactionForm />
    </main>
  );
}
