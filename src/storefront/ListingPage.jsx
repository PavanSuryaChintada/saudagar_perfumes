import React from 'react';
import BluorngCollectionPage from '../components/BluorngCollectionPage.jsx';

/** Shop, category, note and search listings share the collection page's grid, filters and sorting. */
export default function ListingPage(props) {
  return <BluorngCollectionPage key={`${props.listing?.kind}:${props.listing?.slug ?? ''}`} {...props} />;
}
