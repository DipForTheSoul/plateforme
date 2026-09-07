export function useRouter() { return {push:()=>{},replace:()=>{},refresh:()=>{}}; }
export function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) { return <a {...props}/>; }
