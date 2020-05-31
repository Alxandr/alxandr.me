import 'normalize.css';
import '../styles/fonts.css';
import '../styles/app.css';
import '../styles/code.css';
import '../styles/loader.css';

import { AppProps } from 'next/app';
import NProgress from 'nprogress';
import { RootLayout } from '@layout/root';
import Router from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RootLayout>
      <Component {...pageProps} />
    </RootLayout>
  );
}

Router.events.on('routeChangeStart', () => {
  NProgress.start();
});

Router.events.on('routeChangeComplete', (url: string) => {
  NProgress.done();
  maybeScrollToContent(url);
  if (process.env.GA_TRACKING_ID) {
    setTimeout(() => {
      (window as any).gtag('config', process.env.GA_TRACKING_ID, {
        page_location: url,
        page_title: document.title,
      });
    }, 0);
  }
});

Router.events.on('routeChangeError', (err, url) => {
  NProgress.done();
  maybeScrollToContent(url);
});

const maybeScrollToContent = (url: string) => {
  const scroll = url.indexOf('#') < 0;
  if (scroll) {
    requestAnimationFrame(() => {
      const contentElement = document.getElementById('content');
      if (!contentElement) return;

      let top = contentElement.offsetTop - 70;
      if (window.innerWidth < 490) {
        top += 30;
      }

      window.scrollTo({
        behavior: 'auto',
        top,
        left: 0,
      });
    });
  }
};
