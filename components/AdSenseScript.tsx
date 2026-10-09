const ADSENSE_CLIENT = "ca-pub-2657741160026304";

export function AdSenseScript() {
  return <script
    id="storyflop-adsense"
    async
    crossOrigin="anonymous"
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
  />;
}
