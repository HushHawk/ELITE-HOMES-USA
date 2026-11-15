'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react';
import { useRef, useState } from 'react';

export type GalleryImage = { id: string; alt: string };

export function MarketGallery({ photos, wall = false, label = 'Property photos' }: { photos: GalleryImage[]; wall?: boolean; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(0);
  const active = photos[selected];
  function move(direction: number) { setSelected(value => (value + direction + photos.length) % photos.length); }
  function show(index: number) { setSelected(index); dialog.current?.showModal(); }
  if (!active) return null;
  return <section className={wall ? 'managed-wall' : 'listing-gallery'} aria-label={label}>
    {wall ? <div className="managed-wall-grid">{photos.map((photo, i) => <button key={photo.id + i} className="managed-wall-image" onClick={() => show(i)} aria-label={'Enlarge ' + photo.alt}>
      <Image src={'/api/media/' + photo.id} alt={photo.alt} fill sizes="(max-width: 650px) 50vw, 33vw"/><Expand size={16}/>
    </button>)}</div> : <>
      <button className="listing-photo" type="button" onClick={() => show(selected)} aria-label={'Enlarge ' + active.alt}>
        <Image src={'/api/media/' + active.id} alt={active.alt} fill preload sizes="(max-width: 850px) 100vw, 66vw"/><span><Expand size={19}/> View photo</span>
      </button>
      {photos.length > 1 && <div className="listing-thumbs">
        {photos.map((photo, i) => <button key={photo.id + i} type="button" onClick={() => setSelected(i)} aria-label={'Show photo ' + (i + 1)} aria-pressed={selected === i}>
          <Image src={'/api/media/' + photo.id} alt={photo.alt} fill sizes="108px"/>
        </button>)}
      </div>}
    </>}
    <dialog ref={dialog} className="market-lightbox" aria-label={label} onKeyDown={e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      <div className="market-lightbox-image"><Image src={'/api/media/' + active.id} alt={active.alt} fill sizes="90vw"/>
        <button className="icon-btn lightbox-close" type="button" autoFocus aria-label="Close photos" onClick={() => dialog.current?.close()}><X size={20}/></button>
      </div>
      <div className="lightbox-strip">
        <button type="button" className="icon-btn" aria-label="Previous photo" onClick={() => move(-1)} disabled={photos.length < 2}><ArrowLeft size={17}/></button>
        <span aria-live="polite">{selected + 1} / {photos.length} · {active.alt}</span>
        <button type="button" className="icon-btn" aria-label="Next photo" onClick={() => move(1)} disabled={photos.length < 2}><ArrowRight size={17}/></button>
      </div>
    </dialog>
  </section>;
}
