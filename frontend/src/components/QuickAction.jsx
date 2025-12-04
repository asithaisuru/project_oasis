const QuickAction = ({ icon: Icon, title, description, onClick, color, disabled }) => {
  const baseBtn = 'p-4 rounded-lg shadow-md border border-gray-200 text-left group w-full transition-all duration-300';
  const enabledBtn = 'bg-white hover:shadow-lg hover:border-blue-200 cursor-pointer';
  const disabledBtn = 'bg-gray-100 cursor-not-allowed hover:shadow-none hover:border-gray-200';
  const iconWrap = disabled
    ? 'p-2 rounded-lg bg-gray-200 inline-block mb-2'
    : `p-2 rounded-lg ${color} bg-opacity-10 inline-block mb-2 group-hover:scale-110 transition-transform`;
  const iconClass = disabled ? 'text-gray-400 text-lg' : `text-lg ${color}`;

  return (
    <button
      onClick={onClick}
      className={`${baseBtn} ${disabled ? disabledBtn : enabledBtn}`}
      disabled={disabled}
    >
      <div className={iconWrap}>
        <Icon className={iconClass} />
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
};

export default QuickAction;