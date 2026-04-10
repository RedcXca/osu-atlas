type CountryFlagProps = {
  code: string | null;
};

export function CountryFlag({ code }: Readonly<CountryFlagProps>) {
  if (!code) {
    return null;
  }

  return (
    <img
      alt={code.toUpperCase()}
      className="country-flag"
      draggable={false}
      height={12}
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      width={16}
    />
  );
}
