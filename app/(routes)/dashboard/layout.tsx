import DashBoardLayoutProvider from "@/provider/dashboard.layout.provider";

const layout = async ({ children, params: { lang } }: { children: React.ReactNode; params: { lang: any } }) => {

  return (
    <DashBoardLayoutProvider>{children}</DashBoardLayoutProvider>
  );
};

export default layout;
