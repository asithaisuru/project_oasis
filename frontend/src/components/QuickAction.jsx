const QuickAction = ({ icon: Icon, title, description, onClick, color }) => (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 text-left group hover:border-blue-200 w-full"
    >
      <div
        className={`p-2 rounded-lg ${color} bg-opacity-10 inline-block mb-2 group-hover:scale-110 transition-transform`}
      >
        <Icon className={`text-lg ${color}`} />
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );

export default QuickAction;