// src/components/ui/avatar.js
const Avatar = ({ src, alt = "Avatar", className }) => {
    return (
        <img
            src={src || "/default-avatar.png"}
            alt={alt}
            className={`w-12 h-12 rounded-full object-cover ${className}`}
        />
    );
};

export default Avatar;