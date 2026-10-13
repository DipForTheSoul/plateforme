export default function Image({fill, sizes, priority, ...props}: React.ImgHTMLAttributes<HTMLImageElement> & {fill?:boolean;priority?:boolean}) {
  void fill; void sizes; void priority;
  // Browser laboratory only; production uses next/image unchanged.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt ?? ''} />;
}
