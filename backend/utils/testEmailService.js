// Simple email service that logs instead of sending
export const sendTestEmail = async (to, subject, html) => {
  console.log('========================================');
  console.log('📧 EMAIL NOTIFICATION (TEST MODE)');
  console.log('========================================');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML Preview:', html.substring(0, 300) + '...');
  console.log('========================================');
  
  // Simulate successful send
  return {
    messageId: `test-${Date.now()}`,
    accepted: to.split(','),
    rejected: []
  };
};