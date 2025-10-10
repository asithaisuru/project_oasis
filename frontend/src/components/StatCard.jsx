const StatCard = ({ title, value, color = "blue", Icon = null }) => {
  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-md border-l-4 border-${color}-500`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && <Icon className={`text-${color}-500 text-xl`} />}
      </div>
    </div>
  );
};

export default StatCard;
