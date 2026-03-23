import React from 'react';
import CharacterMain from '../../assets/images/character_new.webp';
import CharacterUser from '../../assets/images/character_user.webp';
import CharacterRen from '../../assets/images/character_ren.webp';
import CharacterCasual from '../../assets/images/character_casual_v9.webp';
import CharacterCasualFall from '../../assets/images/noa_casual_fall.webp';
import CharacterGym from '../../assets/images/character_gym.webp';
import CharacterCasualGray from '../../assets/images/character_casual_gray_hoodie.webp';
import CharacterCasualBlack from '../../assets/images/character_casual_hoodie.webp';
import NoaHappy from '../../assets/images/noah_happy.webp';
import NoaNormal from '../../assets/images/noah_normal.webp';
import NoaAngry from '../../assets/images/noah_angry.webp';
import RenNormal from '../../assets/images/ren_normal.webp';
import RenAngry from '../../assets/images/ren_angry.webp';
import RenHappy from '../../assets/images/ren_happy.webp';
import { getSkinFilter } from '../../utils/cosmeticUtils';

const NOAH_SKIN_IMAGES = {
    default: CharacterMain,
    skin_casual: CharacterCasual,
    skin_casual_fall: CharacterCasualFall,
    skin_gym: CharacterGym,
    skin_casual_gray_hoodie: CharacterCasualGray,
    skin_casual_hoodie: CharacterCasualBlack,
};

const REN_SKIN_IMAGES = {
    default: CharacterRen,
    skin_casual: CharacterRen,
    skin_casual_fall: CharacterRen,
};

const NOAH_EXPRESSION_IMAGES = {
    default: NoaNormal,
    main: NoaNormal,
    new: CharacterMain,
    tsundere: NoaNormal,
    user: CharacterUser,
    happy: NoaHappy,
    normal: NoaNormal,
    angry: NoaAngry,
    serious: NoaNormal,
    smile: NoaHappy,
    shy: NoaHappy,
    sad: NoaNormal,
    surprised: NoaHappy,
    relaxed: NoaNormal,
};

const REN_EXPRESSION_IMAGES = {
    default: RenNormal,
    main: RenNormal,
    new: RenNormal,
    happy: RenHappy,
    normal: RenNormal,
    angry: RenAngry,
    serious: RenNormal,
    smile: RenHappy,
    shy: RenHappy,
    sad: RenNormal,
    surprised: RenHappy,
    relaxed: RenNormal,
};

const resolveImage = (characterId, skinId, pose = {}) => {
    const isRen = characterId === 'ren';
    const skinImages = isRen ? REN_SKIN_IMAGES : NOAH_SKIN_IMAGES;
    const expressionImages = isRen ? REN_EXPRESSION_IMAGES : NOAH_EXPRESSION_IMAGES;
    const expressionKey = pose.expression || pose.emotion || 'normal';

    return expressionImages[expressionKey] || skinImages[skinId] || skinImages.default;
};

const StaticCharacterImage = ({
    characterId = 'noah',
    skinId = 'default',
    pose = {},
    alt = 'Character',
    className = '',
    style,
}) => {
    const source = resolveImage(characterId, skinId, pose);
    const filter = getSkinFilter(skinId);
    const expressionKey = pose.expression || pose.emotion || 'normal';
    const shouldKeepSkinFilter = !['happy', 'smile'].includes(expressionKey);

    return (
        <img
            src={source}
            alt={alt}
            className={className}
            style={{
                ...(shouldKeepSkinFilter ? { filter } : {}),
                ...style,
            }}
        />
    );
};

export default StaticCharacterImage;
