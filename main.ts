import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface WorkingStatusSettings {
	debug: boolean;
} 

const DEFAULT_SETTINGS: WorkingStatusSettings = {
	debug: false
}
const except_char = new RegExp(/[^ \r\0\n\t]/gm)

export default class WorkingStatus extends Plugin {
	settings: WorkingStatusSettings;
	start_time: number;
	work_last_time: number;
	work_start_time: number;
	is_working: boolean;
	start_len: number;
	cph: number;
	last_cph: number;
	work_in_second: number;
	rest_in_second: number;
	is_debug: boolean;
	get_valid() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const data = view.editor.getValue();
			const match = data.match(except_char);
			if (match) {
				if (this.is_debug) console.log("match", match);
				return match;
			} else {
				return null
			}
		} else {
			return null;
		}

	}
	step() {
		const data = this.get_valid();
		if (data) {
			this.start_len = data.length;

			this.start_time = this.work_start_time = Date.now();
			this.last_cph = this.cph;
			console.log(`${this.last_cph}: ${this.cph}`);
			this.is_working = false;
		}
	}

	get_count() {
		const data = this.get_valid();
		// Make sure the user is editing a Markdown file.
		if (data) {
			console.log(data.length);
			let len = data.length - (this.start_len);
			if (len < 0)
				len = 0;
			let time = (Date.now() - (this.start_time))

			this.cph =
				this.last_cph * 0.333 + ((len / time) * 3600 * 1000) * 0.666;
			// if (this.is_debug) {
				console.log(`${this.last_cph}: ${len} / ${time} = ${this.cph}`);
				console.log(`working:${this.is_working}, work:${this.work_in_second}, rest:${this.rest_in_second}`)
			// }

			if (this.is_working) {
				this.work_in_second += 1;
			} else {
				this.rest_in_second += 1;
			}
			// ...
		} else {
			if (this.is_debug) console.log("no view get \n");
		}
	}
	secondsToHMS(seconds: number) {
		let hours = Math.floor(seconds / 3600);
		let minutes = Math.floor((seconds % 3600) / 60);
		let remainingSeconds = Math.floor(seconds % 60);

		let formattedTime = hours.toString().padStart(2, '0') + ':' +
			minutes.toString().padStart(2, '0') + ':' +
			remainingSeconds.toString().padStart(2, '0');

		return formattedTime;
	}
	reset_status() {
		this.start_time = this.work_start_time = this.work_last_time = Date.now();
		this.start_len = 0//this.app.workspace.getActiveViewOfType(MarkdownView)?.editor.getValue();
		this.cph = this.last_cph = 0;
	}
	async onload() {
		this.reset_status();
		this.is_working = false;
		this.work_in_second = this.rest_in_second = 0;
		await this.loadSettings();

		// const item = this.addStatusBarItem();
		// item.createEl("span", { text: this.www.toString() });
		this.registerEvent(this.app.workspace.on('editor-change', (editor) => {
			this.is_working = true;
		}));
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf) {
					const v = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (v)
						this.start_len = v.data.length;
				}

			})
		);

		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => {
				this.get_count();
				statusBarItemEl.setText(`每小时字数：${String(Math.floor(this.cph))}
									，工作时间：${this.secondsToHMS(this.work_in_second)}
									，空闲时间：${this.secondsToHMS(this.rest_in_second)}`);
				// console.log(this.www); 
			}, 1000));
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => {
			this.step();
		}, 2500));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class SettingTab extends PluginSettingTab {
	plugin: WorkingStatus;
	//
	constructor(app: App, plugin: WorkingStatus) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Debug Mode')
			.setDesc('It\'s a secret')
			
			.addToggle(t => {  t
				.setValue(this.plugin.settings.debug)
				.onChange( async v => {
				this.plugin.settings.debug = v;
				console.log("vvv:" , v,"s" ,this.plugin.settings);
				await this.plugin.saveSettings();})
			});

	}
}
