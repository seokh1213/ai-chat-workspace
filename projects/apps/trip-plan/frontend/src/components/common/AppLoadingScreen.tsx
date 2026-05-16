import { LoadingState } from "./LoadingState";

export function AppLoadingScreen(props: { title: string; detail?: string }) {
  return (
    <main className="app-page app-loading-page">
      <section className="app-splash" aria-live="polite">
        <img src="/app-icon.svg" alt="" />
        <LoadingState title={props.title} detail={props.detail} />
      </section>
    </main>
  );
}
