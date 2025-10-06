import logo from '@/assets/logo.png';

const BrandLogo = () => {
  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      <img
        id="img-logo"
        src={logo}
        alt="Carbon Dashboard Logo"
        className="max-w-full max-h-full object-contain"
        style={{ maxWidth: '300px', maxHeight: '300px' }}
      />
    </div>
  );
};

export default BrandLogo;
