export default function NotFound() {
  return (
    <main className="wrap-read flex min-h-[60vh] flex-col items-start justify-center gap-6 py-20">
      <p className="eyebrow">404</p>
      <h1 className="t-page">Здесь ничего нет</h1>
      <p className="t-lead">Похоже, страница улетела. Начните с миров — их можно пройти все.</p>
      <a href="/" className="btn btn-ghost">На главную</a>
    </main>
  );
}
