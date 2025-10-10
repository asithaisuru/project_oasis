// import React from 'react';
// import { QRCodeSVG } from 'qrcode.react';
// import { FaDownload, FaQrcode } from 'react-icons/fa';

// const StudentQRCode = ({ student, onDownload }) => {
//   const generateQRPayload = (student) => {
//     const qrPayload = {
//       studentId: student._id,
//       studentName: student.name,
//       type: 'student_attendance',
//       timestamp: new Date().toISOString()
//     };
//     return JSON.stringify(qrPayload);
//   };

//   const downloadQRCode = async (student) => {
//     try {
//       // Create a canvas element
//       const canvas = document.createElement('canvas');
//       const size = 300;
//       canvas.width = size;
//       canvas.height = size;
//       const ctx = canvas.getContext('2d');

//       // Create a temporary container for QR code
//       const tempDiv = document.createElement('div');
//       tempDiv.style.position = 'absolute';
//       tempDiv.style.left = '-9999px';
//       document.body.appendChild(tempDiv);

//       // Render QR code to canvas
//       const qrValue = generateQRPayload(student);
      
//       // Create QR code using canvas (simplified version)
//       // In a real implementation, you might want to use a canvas-based QR library
//       ctx.fillStyle = 'white';
//       ctx.fillRect(0, 0, size, size);
      
//       // Draw QR code placeholder (you would use actual QR generation here)
//       ctx.fillStyle = 'black';
//       ctx.font = '16px Arial';
//       ctx.textAlign = 'center';
//       ctx.fillText('QR CODE', size/2, size/2 - 20);
//       ctx.fillText(student.name, size/2, size/2 + 10);
//       ctx.font = '12px Arial';
//       ctx.fillText(`ID: ${student.studentId}`, size/2, size/2 + 30);

//       // Convert to blob and download
//       canvas.toBlob((blob) => {
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.download = `student_${student.studentId}_qrcode.png`;
//         link.href = url;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
        
//         // Cleanup
//         document.body.removeChild(tempDiv);
        
//         // Call callback if provided
//         if (onDownload) {
//           onDownload(student);
//         }
//       }, 'image/png');
//     } catch (error) {
//       console.error('Error downloading QR code:', error);
//       alert('Error downloading QR code. Please try again.');
//     }
//   };

//   return (
//     <div className="bg-white p-4 rounded-lg shadow-md border text-center">
//       <div className="flex items-center justify-center space-x-2 mb-3">
//         <FaQrcode className="text-blue-600" />
//         <h4 className="font-semibold text-gray-800">Student QR Code</h4>
//       </div>
      
//       <div className="mb-3">
//         <QRCodeSVG 
//           value={generateQRPayload(student)} 
//           size={150}
//           level="H"
//           includeMargin
//           className="mx-auto border rounded"
//         />
//       </div>
      
//       <div className="text-sm font-medium text-gray-900 truncate mb-1">
//         {student.name}
//       </div>
//       <div className="text-xs text-gray-500 mb-3">
//         ID: {student.studentId} | Grade {student.grade}
//       </div>
      
//       <button
//         onClick={() => downloadQRCode(student)}
//         className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-2 transition-colors duration-200"
//       >
//         <FaDownload className="w-3 h-3" />
//         <span>Download QR Code</span>
//       </button>
//     </div>
//   );
// };

// export default StudentQRCode;