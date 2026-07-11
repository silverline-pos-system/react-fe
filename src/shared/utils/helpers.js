export const getStatusColor = (status) => {
    switch (status) {
        case 'In Stock': return 'bg-green-100 text-green-700';
        case 'Low Stock': return 'bg-orange-100 text-orange-700';
        case 'Out of Stock': return 'bg-red-100 text-red-700';
        case 'Pending': return 'bg-yellow-100 text-yellow-700';
        case 'Approved': return 'bg-blue-100 text-blue-700';
        case 'Completed': return 'bg-green-100 text-green-700';
        case 'Safe': return 'bg-green-100 text-green-700 border-green-300'; // Added for BatchWise
        case 'Near Expiry': return 'bg-yellow-100 text-yellow-700 border-yellow-300'; // Added for BatchWise
        case 'Expired': return 'bg-red-100 text-red-700 border-red-300'; // Added for BatchWise
        default: return 'bg-gray-100 text-gray-700';
    }
};
