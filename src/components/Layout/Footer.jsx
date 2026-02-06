import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, BarChart3, Home, Target, Users, Sparkles } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <nav className="footer-nav">
            <NavItem to="/story" icon={<BookOpen size={24} />} label="ストーリー" />
            <NavItem to="/stats" icon={<BarChart3 size={24} />} label="統計" />
            <NavItem to="/" icon={<Home size={28} />} label="ホーム" isMain />
            <NavItem to="/gacha" icon={<Sparkles size={24} />} label="ガチャ" />
            <NavItem to="/character" icon={<Users size={24} />} label="キャラ" />
        </nav>
    );
};

const NavItem = ({ to, icon, label, isMain }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `nav-item ${isMain ? 'nav-item-main' : ''} ${isActive ? 'active' : ''}`}
    >
        <div className="nav-icon">{icon}</div>
        <span className="nav-label">{label}</span>
    </NavLink>
);

export default Footer;
