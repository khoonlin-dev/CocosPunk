
export let css = `
/* this CSS contains only the basic CSS needed to run the app and use it */

.lgraphcanvas {
    /*cursor: crosshair;*/
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
	outline: none;
    font-family: Tahoma, sans-serif;
}

.lgraphcanvas * {
    box-sizing: border-box;
}

.litegraph.litecontextmenu {
    font-family: Tahoma, sans-serif;
    position: fixed;
    top: 100px;
    left: 100px;
    min-width: 100px;
    color: #aaf;
    padding: 0;
    box-shadow: 0 0 10px black !important;
    background-color: #2e2e2e !important;
	z-index: 10;
}

.litegraph.litecontextmenu.dark {
    background-color: #000 !important;
}

.litegraph.litecontextmenu .litemenu-title img {
    margin-top: 2px;
    margin-left: 2px;
    margin-right: 4px;
}

.litegraph.litecontextmenu .litemenu-entry {
    margin: 2px;
    padding: 2px;
}

.litegraph.litecontextmenu .litemenu-entry.submenu {
    background-color: #2e2e2e !important;
}

.litegraph.litecontextmenu.dark .litemenu-entry.submenu {
    background-color: #000 !important;
}

.litegraph .litemenubar ul {
    font-family: Tahoma, sans-serif;
    margin: 0;
    padding: 0;
}

.litegraph .litemenubar li {
    font-size: 14px;
    color: #999;
    display: inline-block;
    min-width: 50px;
    padding-left: 10px;
    padding-right: 10px;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
}

.litegraph .litemenubar li:hover {
    background-color: #777;
    color: #eee;
}

.litegraph .litegraph .litemenubar-panel {
    position: absolute;
    top: 5px;
    left: 5px;
    min-width: 100px;
    background-color: #444;
    box-shadow: 0 0 3px black;
    padding: 4px;
    border-bottom: 2px solid #aaf;
    z-index: 10;
}

.litegraph .litemenu-entry,
.litemenu-title {
    font-size: 12px;
    color: #aaa;
    padding: 0 0 0 4px;
    margin: 2px;
    padding-left: 2px;
    -moz-user-select: none;
    -webkit-user-select: none;
    user-select: none;
    cursor: pointer;
}

.litegraph .litemenu-entry .icon {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin: 2px;
    vertical-align: top;
}

.litegraph .litemenu-entry.checked .icon {
    background-color: #aaf;
}

.litegraph .litemenu-entry .more {
    float: right;
    padding-right: 5px;
}

.litegraph .litemenu-entry.disabled {
    opacity: 0.5;
    cursor: default;
}

.litegraph .litemenu-entry.separator {
    display: block;
    border-top: 1px solid #333;
    border-bottom: 1px solid #666;
    width: 100%;
    height: 0px;
    margin: 3px 0 2px 0;
    background-color: transparent;
    padding: 0 !important;
    cursor: default !important;
}

.litegraph .litemenu-entry.has_submenu {
    border-right: 2px solid cyan;
}

.litegraph .litemenu-title {
    color: #dde;
    background-color: #111;
    margin: 0;
    padding: 2px;
    cursor: default;
}

.litegraph .litemenu-entry:hover:not(.disabled):not(.separator) {
    background-color: #444 !important;
    color: #eee;
    transition: all 0.2s;
}

.litegraph .litemenu-entry .property_name {
    display: inline-block;
    text-align: left;
    min-width: 80px;
    min-height: 1.2em;
}

.litegraph .litemenu-entry .property_value {
    display: inline-block;
    background-color: rgba(0, 0, 0, 0.5);
    text-align: right;
    min-width: 80px;
    min-height: 1.2em;
    vertical-align: middle;
    padding-right: 10px;
}

.litegraph.litesearchbox {
    font-family: Tahoma, sans-serif;
    position: absolute;
    background-color: rgba(0, 0, 0, 0.5);
    padding-top: 4px;
}

.litegraph.litesearchbox input,
.litegraph.litesearchbox select {
    margin-top: 3px;
    min-width: 60px;
    min-height: 1.5em;
    background-color: black;
    border: 0;
    color: white;
    padding-left: 10px;
    margin-right: 5px;
}

.litegraph.litesearchbox .name {
    display: inline-block;
    min-width: 60px;
    min-height: 1.5em;
    padding-left: 10px;
}

.litegraph.litesearchbox .helper {
    overflow: auto;
    max-height: 200px;
    margin-top: 2px;
}

.litegraph.lite-search-item {
    font-family: Tahoma, sans-serif;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding-top: 2px;
}

.litegraph.lite-search-item.not_in_filter{
    /*background-color: rgba(50, 50, 50, 0.5);*/
    /*color: #999;*/
    color: #B99;
    font-style: italic;
}

.litegraph.lite-search-item.generic_type{
    /*background-color: rgba(50, 50, 50, 0.5);*/
    /*color: #DD9;*/
    color: #999;
    font-style: italic;
}

.litegraph.lite-search-item:hover,
.litegraph.lite-search-item.selected {
    cursor: pointer;
    background-color: white;
    color: black;
}

/* DIALOGs ******/

.litegraph .dialog {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -150px;
    margin-left: -200px;

    background-color: #2A2A2A;

    min-width: 400px;
    min-height: 200px;
	box-shadow: 0 0 4px #111;
    border-radius: 6px;
}

.litegraph .dialog.settings {
	left: 10px;
	top: 10px;
	height: calc( 100% - 20px );
	margin: auto;
    max-width: 50%;
}

.litegraph .dialog.centered {
    top: 50px;
    left: 50%;
    position: absolute;
    transform: translateX(-50%);
    min-width: 600px;
    min-height: 300px;
    height: calc( 100% - 100px );
	margin: auto;
}

.litegraph .dialog .close {
    float: right;
	margin: 4px;
	margin-right: 10px;
	cursor: pointer;
	font-size: 1.4em;
}

.litegraph .dialog .close:hover {
	color: white;
}

.litegraph .dialog .dialog-header {
	color: #AAA;
	border-bottom: 1px solid #161616;
}

.litegraph .dialog .dialog-header { height: 40px; }
.litegraph .dialog .dialog-footer { height: 50px; padding: 10px; border-top: 1px solid #1a1a1a;}

.litegraph .dialog .dialog-header .dialog-title {
    font: 20px "Arial";
    margin: 4px;
    padding: 4px 10px;
    display: inline-block;
}

.litegraph .dialog .dialog-content, .litegraph .dialog .dialog-alt-content {
    height: calc(100% - 90px);
    width: 100%;
	min-height: 100px;
    display: inline-block;
	color: #AAA;
    /*background-color: black;*/
    overflow: auto;
}

.litegraph .dialog .dialog-content h3 {
	margin: 10px;
}

.litegraph .dialog .dialog-content .connections {
	flex-direction: row;
}

.litegraph .dialog .dialog-content .connections .connections_side {
	width: calc(50% - 5px);
	min-height: 100px;
	background-color: black;
	display: flex;
}

.litegraph .dialog .node_type {
	font-size: 1.2em;
	display: block;
	margin: 10px;
}

.litegraph .dialog .node_desc {
	opacity: 0.5;
	display: block;
	margin: 10px;
}

.litegraph .dialog .separator {
	display: block;
	width: calc( 100% - 4px );
	height: 1px;
	border-top: 1px solid #000;
	border-bottom: 1px solid #333;
	margin: 10px 2px;
	padding: 0;
}

.litegraph .dialog .property {
	margin-bottom: 2px;
	padding: 4px;
}

.litegraph .dialog .property:hover {
	background: #545454;
}

.litegraph .dialog .property_name {
	color: #737373;
    display: inline-block;
    text-align: left;
    vertical-align: top;
    width: 160px;
	padding-left: 4px;
	overflow: hidden;
    margin-right: 6px;
}

.litegraph .dialog .property:hover .property_name {
    color: white;
}

.litegraph .dialog .property_value {
    display: inline-block;
    text-align: right;
	color: #AAA;
	background-color: #1A1A1A;
    /*width: calc( 100% - 122px );*/
    max-width: calc( 100% - 162px );
    min-width: 200px;
	max-height: 300px;
    min-height: 20px;
    padding: 4px;
	padding-right: 12px;
	overflow: hidden;
	cursor: pointer;
	border-radius: 3px;
}

.litegraph .dialog .property_value:hover {
	color: white;
}

.litegraph .dialog .property.boolean .property_value {
	padding-right: 30px;
    color: #A88;
    /*width: auto;
    float: right;*/
}

.litegraph .dialog .property.boolean.bool-on .property_name{
    color: #8A8;
}
.litegraph .dialog .property.boolean.bool-on .property_value{
    color: #8A8;
}

.litegraph .dialog .btn {
	border: 0;
	border-radius: 4px;
    padding: 4px 20px;
    margin-left: 0px;
    background-color: #060606;
    color: #8e8e8e;
}

.litegraph .dialog .btn:hover {
    background-color: #111;
    color: #FFF;
}

.litegraph .dialog .btn.delete:hover {
    background-color: #F33;
    color: black;
}

.litegraph .subgraph_property {
	padding: 4px;
}

.litegraph .subgraph_property:hover {
	background-color: #333;
}

.litegraph .subgraph_property.extra {
    margin-top: 8px;
}

.litegraph .subgraph_property span.name {
	font-size: 1.3em;
	padding-left: 4px;
}

.litegraph .subgraph_property span.type {
	opacity: 0.5;
	margin-right: 20px;
	padding-left: 4px;
}

.litegraph .subgraph_property span.label {
	display: inline-block;
	width: 60px;
	padding:  0px 10px;
}

.litegraph .subgraph_property input {
	width: 140px;
	color: #999;
	background-color: #1A1A1A;
	border-radius: 4px;
	border: 0;
	margin-right: 10px;
	padding: 4px;
	padding-left: 10px;
}

.litegraph .subgraph_property button {
	background-color: #1c1c1c;
	color: #aaa;
	border: 0;
	border-radius: 2px;
	padding: 4px 10px;
	cursor: pointer;
}

.litegraph .subgraph_property.extra {
	color: #ccc;
}

.litegraph .subgraph_property.extra input {
	background-color: #111;
}

.litegraph .bullet_icon {
	margin-left: 10px;
	border-radius: 10px;
	width: 12px;
	height: 12px;
	background-color: #666;
	display: inline-block;
	margin-top: 2px;
	margin-right: 4px;
    transition: background-color 0.1s ease 0s;
    -moz-transition: background-color 0.1s ease 0s;
}

.litegraph .bullet_icon:hover {
	background-color: #698;
	cursor: pointer;
} 

/* OLD */

.graphcontextmenu {
    padding: 4px;
    min-width: 100px;
}

.graphcontextmenu-title {
    color: #dde;
    background-color: #222;
    margin: 0;
    padding: 2px;
    cursor: default;
}

.graphmenu-entry {
    box-sizing: border-box;
    margin: 2px;
    padding-left: 20px;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    transition: all linear 0.3s;
}

.graphmenu-entry.event,
.litemenu-entry.event {
    border-left: 8px solid orange;
    padding-left: 12px;
}

.graphmenu-entry.disabled {
    opacity: 0.3;
}

.graphmenu-entry.submenu {
    border-right: 2px solid #eee;
}

.graphmenu-entry:hover {
    background-color: #555;
}

.graphmenu-entry.separator {
    background-color: #111;
    border-bottom: 1px solid #666;
    height: 1px;
    width: calc(100% - 20px);
    -moz-width: calc(100% - 20px);
    -webkit-width: calc(100% - 20px);
}

.graphmenu-entry .property_name {
    display: inline-block;
    text-align: left;
    min-width: 80px;
    min-height: 1.2em;
}

.graphmenu-entry .property_value,
.litemenu-entry .property_value {
    display: inline-block;
    background-color: rgba(0, 0, 0, 0.5);
    text-align: right;
    min-width: 80px;
    min-height: 1.2em;
    vertical-align: middle;
    padding-right: 10px;
}

.graphdialog {
    position: absolute;
    top: 10px;
    left: 10px;
    min-height: 2em;
    background-color: #333;
    font-size: 1.2em;
    box-shadow: 0 0 10px black !important;
	z-index: 10;
}

.graphdialog.rounded {
    border-radius: 12px;
    padding-right: 2px;
}

.graphdialog .name {
    display: inline-block;
    min-width: 60px;
    min-height: 1.5em;
    padding-left: 10px;
}

.graphdialog input,
.graphdialog textarea,
.graphdialog select {
    margin: 3px;
    min-width: 60px;
    min-height: 1.5em;
    background-color: black;
    border: 0;
    color: white;
    padding-left: 10px;
    outline: none;
}

.graphdialog textarea {
	min-height: 150px;
}

.graphdialog button {
    margin-top: 3px;
    vertical-align: top;
    background-color: #999;
	border: 0;
}

.graphdialog button.rounded,
.graphdialog input.rounded {
    border-radius: 0 12px 12px 0;
}

.graphdialog .helper {
    overflow: auto;
    max-height: 200px;
}

.graphdialog .help-item {
    padding-left: 10px;
}

.graphdialog .help-item:hover,
.graphdialog .help-item.selected {
    cursor: pointer;
    background-color: white;
    color: black;
}

.litegraph .dialog {
    min-height: 0;
}
.litegraph .dialog .dialog-content {
display: block;
}
.litegraph .dialog .dialog-content .subgraph_property {
padding: 5px;
}
.litegraph .dialog .dialog-footer {
margin: 0;
}
.litegraph .dialog .dialog-footer .subgraph_property {
margin-top: 0;
display: flex;
align-items: center;
padding: 5px;
}
.litegraph .dialog .dialog-footer .subgraph_property .name {
flex: 1;
}
.litegraph .graphdialog {
display: flex;
align-items: center;
border-radius: 20px;
padding: 4px 10px;
position: fixed;
}
.litegraph .graphdialog .name {
padding: 0;
min-height: 0;
font-size: 16px;
vertical-align: middle;
}
.litegraph .graphdialog .value {
font-size: 16px;
min-height: 0;
margin: 0 10px;
padding: 2px 5px;
}
.litegraph .graphdialog input[type="checkbox"] {
width: 16px;
height: 16px;
}
.litegraph .graphdialog button {
padding: 4px 18px;
border-radius: 20px;
cursor: pointer;
}
  

`