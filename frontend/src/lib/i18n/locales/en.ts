export interface Dictionary {
  [key: string]: any;
}

export const en: Dictionary = {
  common: {
    appTitle: 'CAMark',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search files, commands, or notes...',
    loading: 'Loading...',
    error: 'An Error Occurred',
    retry: 'Retry',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    done: 'Done',
    copy: 'Copy',
    copied: 'Copied',
    actions: 'Actions',
    emptyState: 'No data yet',
    noResults: 'No matching results',
    required: 'Required'
  },
  shell: {
    theme: 'Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme'
  },
  nav: {
    workspace: 'Files & Folders',
    editor: 'Markdown Studio',
    vault: 'Encrypted Vault',
    ai_copilot: 'AI Copilot',
    notes: 'Notes',
    settings: 'Settings',
    contribution: 'Contribution'
  },
  profileMenu: {
    account: 'Account',
    accountMenu: 'Account Menu',
    editProfile: 'Edit Profile',
    planFree: 'Free Plan',
    planPro: 'Pro Plan',
    about: 'About CAMark',
    reportBug: 'Report an Issue',
    lockScreen: 'Lock Vault',
    signOut: 'Sign Out',
    vaultEncrypted: 'Vault Encrypted (SQLCipher)'
  },
  about: {
    title: 'About CAMark',
    tagline: 'High-Performance, Local-First & Zero-Knowledge Markdown Studio',
    license: 'License',
    website: 'Website',
    source: 'Source Code',
    builtBy: 'Built by',
    dedication: 'Dedication',
    dedicationText: 'Created with devotion for high productivity, privacy, and seamless note-taking.',
    copyright: '© 2026 CAMark · Crafted with care by',
    builtWithLove: 'Built with love',
    love: 'Love',
    fromIndonesia: 'from Indonesia',
    indonesia: 'Indonesia',
    closeDialog: 'Close dialog'
  },
  feedback: {
    title: 'Send Feedback',
    subtitle: 'Help us improve CAMark with your suggestions, bug reports, and ideas.',
    ratingLabel: 'How was your experience?',
    starsOutOf: 'stars out of 5',
    starRating: 'Rating',
    messageLabel: 'Your Message',
    messagePlaceholder: 'Describe what worked well or what could be improved...',
    activityLabel: 'Current Activity',
    activityPlaceholder: 'e.g. Editing Markdown, Live KaTeX Math Preview...',
    nameLabel: 'Your Name',
    namePlaceholder: 'e.g. Cecep Azhar',
    optional: 'Optional',
    send: 'Send Feedback',
    sending: 'Sending...',
    thanks: 'Thank you!',
    submittedTitle: 'Feedback Received',
    submittedBody: 'Thank you for helping make CAMark better.',
    sendAnother: 'Send Another',
    done: 'Done',
    closeDialog: 'Close feedback dialog',
    errRating: 'Please select a star rating.',
    maxChars: 'Maximum 1000 characters.',
    moderationNote: 'Submissions are reviewed to keep the platform safe.'
  },
  crash: {
    title: 'Application Error Report',
    subtitle: 'CAMark encountered an unexpected issue and recovered.',
    whatHappened: 'What were you doing when this happened?',
    location: 'Location',
    viewDetails: 'View Technical Details',
    hideDetails: 'Hide Details',
    send: 'Send Crash Report',
    sending: 'Sending...',
    sendFailed: 'Failed to send report',
    sentThanks: 'Crash report sent. Thank you!',
    deleteAndClose: 'Dismiss & Delete',
    neverAskAgain: "Don't ask again",
    closeDialog: 'Close dialog'
  },
  updater: {
    available: 'Update Available',
    readyBody: 'A new version of CAMark is ready to install.',
    changelog: 'Changelog',
    installRestart: 'Update & Restart',
    dismiss: 'Later',
    failed: 'Update check failed'
  },
  dualSplit: {
    single: 'Single View',
    twoColumns: 'Two Columns',
    twoRows: 'Two Rows',
    grid: '2x2 Grid',
    splitRight: 'Split Right',
    splitDown: 'Split Down',
    closePane: 'Close Pane',
    closeGroup: 'Close Group',
    addGroup: 'Add Group',
    viewSuffix: 'View'
  },
  notify: {
    closeNotification: 'Close',
    confirmTitle: 'Confirmation',
    continue: 'Continue'
  },
  avatars: {
    pickerLabel: 'Choose Profile Avatar'
  },
  language: {
    label: 'Language',
    en: 'English',
    id: 'Indonesian'
  },
  lock: {
    tagline: 'High-Performance, Local-First & Zero-Knowledge Markdown Studio',
    quotes: {
      torvalds: 'Talk is cheap. Show me the code.',
      jobs: 'The only way to do great work is to love what you do.',
      hopper: 'It is easier to ask forgiveness than it is to get permission.',
      beck: 'Make it work, make it right, make it fast.'
    },
    zkTitle: 'Zero-Knowledge Encrypted Studio',
    zkBody: 'Your documents are stored with high security. No data ever leaves without your explicit permission.',
    zkIdentity: 'Local Studio Protected',
    welcomeBack: 'Welcome Back, {name}',
    setupTitle: 'Create Master Password',
    localIdentity: 'Local Identity',
    encrypted: 'ENCRYPTED',
    masterPassword: 'Master Password',
    createMasterPassword: 'Create Master Password',
    hidePassword: 'Hide Password',
    showPassword: 'Show Password',
    unlockVault: 'Open CAMark Studio',
    createVault: 'Initialize Studio',
    unlocking: 'Opening...',
    settingUp: 'Setting up...',
    resetVault: 'Reset Data',
    resetTitle: 'Reset Vault Data',
    resetConfirm: 'Are you sure you want to reset all encrypted vault data?',
    resetYes: 'Yes, Reset',
    resetDone: 'Vault has been reset',
    resetFailed: 'Failed to reset vault',
    resetToast: 'Vault data cleared',
    errEmpty: 'Password cannot be empty',
    errInvalid: 'Invalid password',
    errMinLength: 'Password must be at least 8 characters',
    attemptsRemaining: '{count} attempts remaining',
    lockedCountdown: 'Locked for {seconds}s',
    unlocked: 'Vault Unlocked',
    created: 'Vault Created',
    vaultEncrypted: 'Zero-Knowledge Security Active',
    yourName: 'Your Name',
    tooManyAttemptsTitle: 'Too Many Attempts',
    tooManyAttemptsBody: 'Temporary cooldown active for security.',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close'
  },
  pro: {
    lock: {
      vaultTab: 'Local Workspace',
      proTab: 'GCC Pro Account',
      signedInAs: 'Signed in as {email}'
    },
    login: {
      title: 'Sign In with GCC Account',
      registerTitle: 'Create GCC Account',
      forgotTitle: 'Reset GCC Password',
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      sendResetLink: 'Send Reset Link',
      sendSetPassword: 'Send Setup Link',
      forgot: 'Forgot password?',
      noAccount: "Don't have an account?",
      backToLogin: 'Back to Sign In',
      checkEmailTitle: 'Check Your Email',
      checkEmailBody: 'We have sent a verification link to your email address.',
      resendVerification: 'Resend Verification',
      verificationResent: 'Verification email sent!',
      resetSent: 'Password reset instructions sent!',
      separateNote: 'GCC manages Pro entitlements across all products.',
      working: 'Processing...'
    },
    errors: {
      PASSWORD_MISMATCH: 'Passwords do not match.'
    }
  },
  vault: {
    title: 'Vault Security',
    masterPassword: 'Master Password',
    confirmPassword: 'Confirm Password',
    enterPassword: 'Enter Master Password',
    setPassword: 'Set Master Password',
    unlock: 'Unlock Vault',
    locked: 'Vault Locked',
    changePassword: 'Change Master Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    resetVault: 'Reset Vault',
    resetWarning: 'This action will permanently delete all local data.',
    unlockedSuccess: 'Vault unlocked successfully',
    invalidPassword: 'Invalid password'
  },
  profiles: {
    title: 'User Profiles',
    selectProfile: 'Select Profile',
    addProfile: 'Add Profile',
    editProfile: 'Edit Profile',
    name: 'Profile Name',
    role: 'Role',
    pin: 'PIN (Optional)',
    enterPin: 'Enter 4-6 digit PIN',
    roles: {
      owner: 'Owner',
      partner: 'Partner',
      member: 'Member',
      child: 'Child'
    },
    switchProfile: 'Switch Profile',
    activeProfile: 'Active'
  },
  settings: {
    title: 'Settings',
    general: 'General',
    appearance: 'Appearance',
    theme: 'Theme',
    themes: {
      system: 'System',
      dark: 'Dark',
      light: 'Light'
    },
    language: 'Language',
    security: 'Security & Profiles',
    ai: 'AI Assistant'
  },
  ai: {
    minimizeBubble: 'Minimize to bubble',
    minimize: 'Minimize',
    floatingCardMode: 'Floating Card Mode',
    fullScreenMode: 'Full Screen Mode',
    resize: 'Resize',
    closeAssistant: 'Close AI Assistant',
    inputPlaceholder: 'Ask something or refine markdown format...',
    send: 'Send',
    askAi: 'Ask AI'
  },
  editor: {
    exportHtmlTitle: 'Export Document to Standalone HTML',
    exportHtml: 'Export HTML',
    newFile: 'Create New File'
  }
};

export default en;
