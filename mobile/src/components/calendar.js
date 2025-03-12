// src/components/ui/calendar.js
import { useState } from "react";

const Calendar = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-lg"
            />
        </div>
    );
};

export default Calendar;