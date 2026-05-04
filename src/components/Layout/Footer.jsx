import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, CalendarDays, Home, Users, Sparkles } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <nav className="footer-nav">
            <NavItem to="/story" icon={<BookOpen size={24} />} label="ストーリー" />
            <NavItem to="/calendar" icon={<CalendarDays size={24} />} label="カレンダー" />
            <NavItem to="/home" icon={<Home size={28} />} label="ホーム" isMain />
            <NavItem to="/shop" icon={<Sparkles size={24} />} label="購買部" />
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
