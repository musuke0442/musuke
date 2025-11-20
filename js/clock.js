/**
 * 時間表示ウィジェット機能
 */
class ClockWidget {
    constructor() {
        console.log('時計ウィジェットを初期化中...');
        this.timeElement = null;
        this.dateElement = null;
        this.weekdayElement = null;
        this.clockWidget = null;
        this.toggleBtn = null;
        this.updateInterval = null;
        this.isCollapsed = false;

        this.initialize();
    }

    initialize() {
        console.log('Initializing ClockWidget...');
        
        try {
            // 要素を初期化
            if (!this.initializeElements()) {
                console.error('Failed to initialize elements');
                return false;
            }
            
            // イベントリスナーを設定
            this.setupEventListeners();
            
            // 折りたたみ状態を復元
            this.loadCollapseState();
            
            // 時計を開始
            this.startClock();
            
            console.log('ClockWidget initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing ClockWidget:', error);
            return false;
        }
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // 基本要素を取得
        this.timeElement = document.getElementById('currentTime');
        this.dateElement = document.getElementById('currentDate');
        this.weekdayElement = document.getElementById('currentWeekday');
        this.toggleBtn = document.getElementById('toggleClockBtn');
        this.clockWidget = document.querySelector('.clock-widget');
        
        // 必要な要素が存在するか確認
        const requiredElements = {
            timeElement: this.timeElement,
            dateElement: this.dateElement,
            weekdayElement: this.weekdayElement,
            toggleBtn: this.toggleBtn,
            clockWidget: this.clockWidget
        };
        
        // 見つからない要素を記録
        const missingElements = Object.entries(requiredElements)
            .filter(([_, element]) => !element)
            .map(([name, _]) => name);
            
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            return false;
        }
        
        return true;
        
    }

    setupEventListeners() {
        // 開閉ボタンのクリックイベント
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCollapse(e);
            });
        }
        
        // ウィジェットのヘッダークリックで折りたたみ
        const header = this.clockWidget?.querySelector('.clock-header');
        if (header) {
            header.addEventListener('click', (e) => this.toggleCollapse(e));
        }
    }

    toggleCollapse(event) {
        // イベントの伝播を防ぐ
        if (event) {
            event.stopPropagation();
        }
        
        // 状態を反転
        this.isCollapsed = !this.isCollapsed;
        
        // アニメーションを適用
        this.applyCollapseState();
        
        // 状態を保存
        this.saveCollapseState();
    }
    
    applyCollapseState() {
        if (!this.clockWidget) return;
        
        // 状態に応じてクラスを切り替え
        if (this.isCollapsed) {
            this.clockWidget.classList.add('collapsed');
            if (this.toggleBtn) {
                this.toggleBtn.setAttribute('title', '開く');
            }
        } else {
            this.clockWidget.classList.remove('collapsed');
            if (this.toggleBtn) {
                this.toggleBtn.setAttribute('title', '閉じる');
            }
        }
    }

    saveCollapseState() {
        if (this.clockWidget) {
            localStorage.setItem('clockCollapsed', this.isCollapsed);
        }
    }

    loadCollapseState() {
        try {
            // 保存された状態を読み込む（デフォルトは展開状態）
            const savedState = localStorage.getItem('clockCollapsed');
            this.isCollapsed = savedState === 'true';
            
            // 状態を適用
            this.applyCollapseState();
            
        } catch (error) {
            console.error('折りたたみ状態の読み込みに失敗しました:', error);
            // エラーが発生した場合はデフォルトで展開状態にする
            this.isCollapsed = false;
            this.applyCollapseState();
        }
    }

    startClock() {
        console.log('Starting clock...');
        this.updateClock();
        this.updateInterval = setInterval(() => {
            console.log('Updating clock...');
            this.updateClock();
        }, 1000);
        console.log('Clock started');
    }

    stopClock() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateClock() {
        try {
            const now = new Date();
            
            // 時刻を24時間表記で表示 (HH:MM:SS)
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            this.timeElement.textContent = `${hours}:${minutes}:${seconds}`;
            
            // 日付を表示 (YYYY/MM/DD)
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            this.dateElement.textContent = `${year}/${month}/${day}`;
            
            // 曜日を表示
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            this.weekdayElement.textContent = weekdays[now.getDay()];
            
        } catch (error) {
            console.error('時刻の更新中にエラーが発生しました:', error);
            this.timeElement.textContent = '--:--:--';
            this.dateElement.textContent = '--/--/--';
            this.weekdayElement.textContent = '--';
        }
    }
}

// ページ読み込み完了時に時計を初期化
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ClockWidget();
    } catch (error) {
        console.error('時計ウィジェットの初期化に失敗しました:', error);
    }
});
