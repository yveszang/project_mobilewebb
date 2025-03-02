// src/components/ui/button.js
const Button = ({ children, onClick, className }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;