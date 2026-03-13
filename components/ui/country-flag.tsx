type CountryFlagProps = {
  code: string | null;
  size?: number;
};

export function CountryFlag({ code, size = 20 }: Readonly<CountryFlagProps>) {
  if (!code) {
    return null;
  }

  const lower = code.toLowerCase();

  return (
    <img
      alt={code.toUpperCase()}
      className="country-flag"
      height={size}
      loading="lazy"
      src={`https://flagcdn.com/w40/${lower}.png`}
      width={Math.round(size * (4 / 3))}
    />
  );
}
