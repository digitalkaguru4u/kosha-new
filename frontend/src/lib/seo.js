import { useEffect } from 'react';

/** Sets title, meta description and JSON-LD for the current page. */
export function useSeo({ title, description, jsonLd }) {
  useEffect(() => {
    document.title = title ? `${title} | Kosha Atelier` : 'Kosha Atelier | Heirloom décor, handmade in India';
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute('content', description);
    let ld = document.getElementById('ld');
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ld'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify(jsonLd || { '@context': 'https://schema.org', '@type': 'Organization', name: 'Kosha Atelier', url: location.origin });
  }, [title, description, JSON.stringify(jsonLd || null)]);
}
