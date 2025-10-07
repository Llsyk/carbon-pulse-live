import logo from "@/assets/logo.jpg";

const BrandLogo = () => {
  return (
    <div className="h-full w-full flex items-center justify-center p-0">
      <img
        id="img-logo"
        src={logo}
        alt="Carbon Dashboard Logo"
        className="object-contain rounded-xl"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default BrandLogo;
