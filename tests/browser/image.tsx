export default function Image({fill, sizes, ...props}: React.ImgHTMLAttributes<HTMLImageElement> & {fill?:boolean}) {
  void fill; void sizes;
  // Browser laboratory only; production uses next/image unchanged.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt ?? ''} />;
}
