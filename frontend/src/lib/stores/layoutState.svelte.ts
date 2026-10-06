// Global layout state for CAMark UI toggles (Nav Sidebar, File Explorer, Zen mode)

let hideSidebar = $state(false);

export function getLayoutState() {
  return {
    get hideSidebar() {
      return hideSidebar;
    },
    set hideSidebar(v: boolean) {
      hideSidebar = v;
    },
    toggleSidebar() {
      hideSidebar = !hideSidebar;
    }
  };
}
