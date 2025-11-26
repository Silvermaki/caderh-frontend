import "../assets/scss/globals.scss";
import "../assets/scss/theme.scss";
import { siteConfig } from "@/config/site";
import Providers from "@/provider/providers";
import "simplebar-react/dist/simplebar.min.css";
import TanstackProvider from "@/provider/providers.client";
import AuthProvider from "@/provider/auth.provider";
import "flatpickr/dist/themes/light.css";
import DirectionProvider from "@/provider/direction.provider";
import { Roboto } from 'next/font/google';
import { GlobalContextProvider } from '@/context/global.context';

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

const roboto = Roboto({ weight: ['100', '300', '400', '500', '700', '900'], subsets: ["latin"], display: "swap", variable: '--font-roboto' });

export default function RootLayout({ children }: { children: React.ReactNode; }) {

  return (
    <html className={`${roboto.variable}`} suppressHydrationWarning={true}>
      <AuthProvider>
        <TanstackProvider>
          <Providers>
            <DirectionProvider>
              <GlobalContextProvider>
                {children}
              </GlobalContextProvider>
            </DirectionProvider>
          </Providers>
        </TanstackProvider>
      </AuthProvider>
    </html>
  );
}
