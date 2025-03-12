// src/components/ui/card.js
const Card = ({ children, className }) => {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-md ${className}`}>
            {children}
        </div>
    );
};

const CardContent = ({ children }) => {
    return <div className="mt-4">{children}</div>;
};

export { Card, CardContent };