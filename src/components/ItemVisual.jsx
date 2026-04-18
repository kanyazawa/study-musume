import React from 'react';
import CharacterCasual from '../assets/images/character_casual_v9.webp';
import CharacterCasualFall from '../assets/images/noa_casual_fall.webp';
import CharacterGym from '../assets/images/character_gym.webp';
import CharacterCasualGray from '../assets/images/character_casual_gray_hoodie.webp';
import CharacterCasualBlack from '../assets/images/character_casual_hoodie.webp';
import BgSunsetShop from '../assets/images/shop/bg_sunset_shop.jpg';
import VoiceCheerPackShop from '../assets/images/shop/voice_cheer_pack_shop.jpg';
import VoiceGoodnightPackShop from '../assets/images/shop/voice_goodnight_pack_shop.jpg';
import SpecialNameCallTicketShop from '../assets/images/shop/special_name_call_ticket_shop.jpg';
import SpecialMemoryAlbumShop from '../assets/images/shop/special_memory_album_shop.jpg';
import './ItemVisual.css';

const ITEM_IMAGE_MAP = {
    'character_casual_v9.webp': CharacterCasual,
    'noa_casual_fall.webp': CharacterCasualFall,
    'character_gym.webp': CharacterGym,
    'character_casual_gray_hoodie.webp': CharacterCasualGray,
    'character_casual_hoodie.webp': CharacterCasualBlack,
    'bg_sunset_shop.jpg': BgSunsetShop,
    'voice_cheer_pack_shop.jpg': VoiceCheerPackShop,
    'voice_goodnight_pack_shop.jpg': VoiceGoodnightPackShop,
    'special_name_call_ticket_shop.jpg': SpecialNameCallTicketShop,
    'special_memory_album_shop.jpg': SpecialMemoryAlbumShop,
};

const getVisualData = (item) => {
    if (!item) {
        return { kind: 'fallback' };
    }

    const previewImageName = item.previewImageName || item.imageName;

    if (previewImageName && ITEM_IMAGE_MAP[previewImageName]) {
        return {
            kind: 'image',
            src: ITEM_IMAGE_MAP[previewImageName],
        };
    }

    if (item.type === 'background' && item.bgStyle) {
        return {
            kind: 'background',
            style: { background: item.bgStyle },
        };
    }

    return { kind: 'fallback' };
};

const ItemVisual = ({ item, className = '', fallbackText, alt }) => {
    const visual = getVisualData(item);
    const classes = [
        'item-visual',
        item?.type ? `item-visual-${item.type}` : '',
        `item-visual-kind-${visual.kind}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} aria-hidden={alt ? undefined : 'true'}>
            {visual.kind === 'image' && (
                <img
                    src={visual.src}
                    alt={alt || item?.name || 'item'}
                    className="item-visual-image"
                />
            )}
            {visual.kind === 'background' && (
                <div className="item-visual-surface" style={visual.style} />
            )}
            {visual.kind === 'fallback' && (
                <span className="item-visual-fallback">
                    {item?.emoji || fallbackText || item?.name?.charAt(0) || '?'}
                </span>
            )}
        </div>
    );
};

export default ItemVisual;
