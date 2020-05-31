import Document, { Head, Html, Main, NextScript } from 'next/document';

const GaTag = ({ trackingId }: { trackingId: string | undefined }) => {
  if (!trackingId) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${trackingId}');
          `,
        }}
      ></script>
    </>
  );
};

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <GaTag trackingId={process.env.GA_TRACKING_ID} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
