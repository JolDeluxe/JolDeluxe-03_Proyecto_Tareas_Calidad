import Header from "./Header";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Header />
      <main className="pt-[90px] sm:pt-[100px] lg:pt-[110px]">{children}</main>
    </>
  );
};

export default Layout;
