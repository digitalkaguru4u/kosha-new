import { Link } from 'react-router-dom';
import { PageHead } from '../components/Layout.jsx';
import { useSeo } from '../lib/seo.js';
export default function NotFound() {
  useSeo({ title: 'Page not found' });
  return <><PageHead title="Page not found" lede="The page you were looking for has moved or no longer exists." /><section style={{ paddingTop: 0 }}><div className="wrap"><Link className="btn" to="/">Return home</Link></div></section></>;
}
