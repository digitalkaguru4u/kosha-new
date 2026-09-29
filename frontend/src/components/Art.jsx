import { memo } from 'react';
import { art } from '../lib/art.js';
import { assetUrl } from '../lib/api.js';

/** Product image: uploaded photo when present, otherwise generated artwork. */
function ArtImpl({ product, v = 0, decorative = false }) {
  const photo = product?.images?.[v] || (v > 0 ? null : product?.images?.[0]);
  if (photo) return <img className="art" src={assetUrl(photo)} alt={decorative ? '' : product.name} loading="lazy" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />;
  if (product?.images?.length && v > 0) return <img className="art" src={assetUrl(product.images[0])} alt={decorative ? '' : product.name} loading="lazy" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />;
  // art() only interpolates validated, escaped values (see lib/art.js)
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: art(product, v, !decorative) }} />;
}
export default memo(ArtImpl);
