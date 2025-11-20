// Lanyard APIでDiscordプレゼンス情報を取得
class DiscordStatusManager {
    constructor() {
        // ユーザーIDとその表示要素のマッピング
        this.users = [
            {
                id: '772268153370968117', // 1つ目のユーザーID
                elements: {
                    profile: 'discordProfile',
                    avatar: 'discordAvatar',
                    displayName: 'discordDisplayName',
                    username: 'discordUsername',
                    status: 'discordStatus'
                },
                lastStatus: null
            },
            {
                id: '958660558528331787', // 2つ目のユーザーID
                elements: {
                    profile: 'discordProfile2',
                    avatar: 'discordAvatar2',
                    displayName: 'discordDisplayName2',
                    username: 'discordUsername2',
                    status: 'discordStatus2'
                },
                lastStatus: null
            }
        ];
        
        this.updateInterval = null;
        
        // 初期化時にエラーハンドリングを追加
        try {
            this.initializeStatus();
        } catch (error) {
            console.error('DiscordStatusManagerの初期化中にエラーが発生しました:', error);
            // エラーが発生しても他の機能に影響を与えないようにする
            this.showAllOffline();
        }
    }
    
    // すべてのユーザーをオフライン状態で表示
    showAllOffline() {
        this.users.forEach(user => this.showOfflineStatus(user));
    }

    async initializeStatus() {
        await Promise.all(this.users.map(user => this.fetchDiscordStatus(user)));
        this.startAutoUpdate();
    }

    async fetchDiscordStatus(user) {
        console.log(`[Lanyard API] ユーザー ${user.id} の情報を取得中...`);
        try {
            const response = await fetch(`https://api.lanyard.rest/v1/users/${user.id}`);
            
            if (!response.ok) {
                console.error(`[Lanyard API] エラー: HTTP ${response.status}`, await response.text());
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`[Lanyard API] レスポンス (${user.id}):`, data);

            if (data.success && data.data) {
                console.log(`[Lanyard API] 表示を更新中 (${user.id})...`);
                this.updateDiscordDisplay(user, data.data);
                this.checkForStatusChange(user, data.data);
            } else {
                console.error(`[Lanyard API] 無効なデータ (${user.id}):`, data);
                this.showOfflineStatus(user);
            }
        } catch (error) {
            console.error(`[Lanyard API] エラー (${user.id}):`, error);
            this.showOfflineStatus(user);
        }
    }

    updateDiscordDisplay(user, data) {
        const { discord_user, discord_status, activities } = data;
        const elements = user.elements;
        const avatarElement = document.getElementById(elements.avatar);
        const profileElement = document.getElementById(elements.profile);
        const displayNameElement = document.getElementById(elements.displayName);
        const usernameElement = document.getElementById(elements.username);

        // アバター画像を更新
        if (avatarElement && discord_user) {
            const avatarUrl = discord_user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${discord_user.avatar}.png?size=128`
                : `https://cdn.discordapp.com/embed/avatars/${discord_user.discriminator % 5}.png`;
                
            avatarElement.src = avatarUrl;
            avatarElement.style.display = 'block';

            // 画像の読み込みエラーハンドリング
            avatarElement.onerror = () => {
                avatarElement.src = 'https://via.placeholder.com/80x80/4A90E2/FFFFFF?text=D';
                avatarElement.style.display = 'block';
                if (profileElement) profileElement.classList.remove('center-content');
            };

            // 画像読み込み成功時の処理
            avatarElement.onload = () => {
                avatarElement.style.display = 'block';
                if (profileElement) profileElement.classList.remove('center-content');
            };
        }

        // 表示名とユーザー名を更新
        if (displayNameElement) {
            displayNameElement.textContent = discord_user.global_name || discord_user.username || 'Unknown User';
        }
        if (usernameElement) {
            usernameElement.textContent = `@${discord_user.username || 'unknown'}`;
        }

        // ステータスに応じた色を設定
        const statusColors = {
            online: '#23a55a',
            idle: '#f0b232',
            dnd: '#f23f43',
            offline: '#80848e'
        };

        // ステータス表示を更新
        this.updateStatusDisplay(elements.status, discord_status, statusColors);

        // アクティビティ表示は削除
    }


    centerProfileContent() {
        if (this.profileElement) {
            this.profileElement.classList.add('center-content');
        }
    }

    updateStatusDisplay(statusElementId, status, statusColors) {
        const statusElement = document.getElementById(statusElementId);
        if (statusElement) {
            const statusText = {
                online: 'Online',
                idle: 'Away',
                dnd: 'Busy',
                offline: 'Offline'
            };

            statusElement.textContent = statusText[status] || 'Unknown';
            statusElement.style.color = statusColors[status] || '#80848e';
        }
    }

    checkForStatusChange(user, data) {
        const { discord_status, activities } = data;
        const currentStatus = discord_status;
        const currentActivity = activities && activities.length > 0 ? activities[0] : null;

        // 初回チェック以外でステータスが変更された場合
        if (user.lastStatus !== null && user.lastStatus !== currentStatus) {
            this.showStatusChangeNotification(currentStatus, user.id);
        }

        // 初回チェック以外でアクティビティが変更された場合
        if (user.lastActivity !== null && JSON.stringify(user.lastActivity) !== JSON.stringify(currentActivity)) {
            this.showActivityChangeNotification(currentActivity, user.id);
        }

        // 現在の状態を保存
        user.lastStatus = currentStatus;
        user.lastActivity = currentActivity;
    }

    showStatusChangeNotification(newStatus, userId) {
        if (!window.simpleNotificationManager || !window.simpleNotificationManager.isGranted) return;

        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const displayName = document.getElementById(user.elements.displayName)?.textContent || 'ユーザー';
        
        const statusMessages = {
            online: `${displayName}がオンラインになりました`,
            idle: `${displayName}が離席中になりました`,
            dnd: `${displayName}が取り込み中になりました`,
            offline: `${displayName}がオフラインになりました`
        };

        const message = statusMessages[newStatus] || `${displayName}のステータスが${newStatus}になりました`;

        window.simpleNotificationManager.showNotification(message, {
            body: 'Discordのステータスが変更されました',
            icon: '/favicon.ico',
            tag: `discord-status-change-${userId}`
        });
    }

    showActivityChangeNotification(newActivity, userId) {
        if (!window.simpleNotificationManager || !window.simpleNotificationManager.isGranted) return;

        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const displayName = document.getElementById(user.elements.displayName)?.textContent || 'ユーザー';

        if (!newActivity) {
            window.simpleNotificationManager.showNotification(`${displayName}のアクティビティが終了しました`, {
                body: 'Discordで何も表示されなくなりました',
                icon: '/favicon.ico',
                tag: `discord-activity-change-${userId}`
            });
            return;
        }

        let activityMessage = '';
        switch (newActivity.type) {
            case 0: // ゲーム
                activityMessage = `musukeが「${newActivity.name}」をプレイし始めました`;
                break;
            case 1: // ストリーミング
                activityMessage = `musukeが「${newActivity.name}」を配信し始めました`;
                break;
            case 2: // 音楽
                activityMessage = `musukeが「${newActivity.name}」を聴き始めました`;
                break;
            case 3: // チーム参加
                activityMessage = `musukeが「${newActivity.name}」に参加しました`;
                break;
            case 5: // 競技
                activityMessage = `musukeが「${newActivity.name}」で競技し始めました`;
                break;
            default:
                activityMessage = `musukeが「${newActivity.name}」を始めました`;
        }

        window.simpleNotificationManager.showNotification(activityMessage, {
            body: 'Discordのアクティビティが変更されました',
            icon: '/favicon.ico',
            tag: 'discord-activity-change'
        });
    }

    showOfflineStatus(user) {
        // オフライン時は要素を非表示にする
        const profileElement = document.getElementById(user.elements.profile);
        if (profileElement) {
            profileElement.style.display = 'none';
        }
    }

    startAutoUpdate() {
        // 既存のインターバルをクリア
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // 30秒ごとに全ユーザーのステータスを更新
        this.updateInterval = setInterval(() => {
            this.users.forEach(user => this.fetchDiscordStatus(user));
        }, 30000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
