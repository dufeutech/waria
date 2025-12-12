import style from "./_examples/style.css?raw";
import reset from "./_examples/reset.css?raw";

import App from "./_examples/components/_app.html?raw";

import accordion from "./_examples/components/accordion.html?raw";
import aspectRatio from "./_examples/components/aspect-ratio.html?raw";
import avatar from "./_examples/components/avatar.html?raw";
import breadcrumb from "./_examples/components/breadcrumb.html?raw";
import carousel from "./_examples/components/carousel.html?raw";
import choice from "./_examples/components/choice.html?raw";
import collapsible from "./_examples/components/collapsible.html?raw";
import contextMenu from "./_examples/components/context-menu.html?raw";
import dialog from "./_examples/components/dialog.html?raw";
import feed from "./_examples/components/feed.html?raw";
import grid from "./_examples/components/grid.html?raw";
import hoverCard from "./_examples/components/hover-card.html?raw";
import label from "./_examples/components/label.html?raw";
import link from "./_examples/components/link.html?raw";
import menu from "./_examples/components/menu.html?raw";
import navigation from "./_examples/components/navigation.html?raw";
import popover from "./_examples/components/popover.html?raw";
import progressbar from "./_examples/components/progressbar.html?raw";
import range from "./_examples/components/range.html?raw";
import scrollbar from "./_examples/components/scrollbar.html?raw";
import select from "./_examples/components/select.html?raw";
import separator from "./_examples/components/separator.html?raw";
import spinbutton from "./_examples/components/spinbutton.html?raw";
import tabs from "./_examples/components/tabs.html?raw";
import toast from "./_examples/components/toast.html?raw";
import switchEl from "./_examples/components/switch.html?raw";
import toggles from "./_examples/components/toggles.html?raw";
import toolbar from "./_examples/components/toolbar.html?raw";
import tooltip from "./_examples/components/tooltip.html?raw";
import tree from "./_examples/components/tree.html?raw";
import treegrid from "./_examples/components/treegrid.html?raw";

export default {
  style: reset + style,
  app: App,
  html: [
    accordion,
    aspectRatio,
    avatar,
    breadcrumb,
    carousel,
    choice,
    collapsible,
    contextMenu,
    dialog,
    feed,
    grid,
    hoverCard,
    label,
    link,
    menu,
    navigation,
    popover,
    progressbar,
    range,
    scrollbar,
    select,
    separator,
    spinbutton,
    switchEl,
    tabs,
    toast,
    toggles,
    toolbar,
    tooltip,
    tree,
    treegrid,
  ].join(" "),
};
