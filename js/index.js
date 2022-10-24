const {
    reactive,
    ref,
    toRefs,
    setup,
    computed,
    onMounted,
    watch
} = Vue;
const App = {
    setup() {

        const setContainerStyle = () => {
            const {
                base,
                row,
                col
            } = config;
            return `height: ${base * row}px; width: ${base * col}px`;
        }
        
        const setCardStyle = ({
            x,
            y
        }) => {
            return `
              transform: translateX(${x}px) translateY(${y}px);
            `;
        }
        
        const setAnimation = ({
            id,
            clear,
            display
        }) => {
            let isClear = ''
            if (clear) {
                isClear = `animation: scaleDraw ${config.animationTime}ms;`
            }
            if (display) {
                isClear += 'display: none;';
            }
            return isClear;
        }

        const randomCreateId = (length) => {
            return (Math.random() + new Date().getTime()).toString(32).slice(0, length);
        }

        onMounted(() => {
            getDoMInfo();
            handleStart();
        })
        const getDoMInfo = () => {
            const containerDom = document.querySelector('.container');
            data.containerInfo = containerDom.getBoundingClientRect();
            const cardSlotDom = document.querySelector('.card-slot');
            data.cardSlotInfo = cardSlotDom.getBoundingClientRect();
        }
        
        const config = reactive({
            base: 40,
            selectMaxLength: 7,
            maxCount: 3,
            animationTime: 400,
            maxLevel: 10,
            row: 8,
            col: 8
        });

        const data = reactive({
            level: 1,
            cards: [],
            select: new Map(),
            containerInfo: null,
            cardSlotInfo: null
        });
        
        watch(() => data.level, () => {
            handleReset();
        });
        watch(() => config.row, () => {
            getDoMInfo();
            data.select.clear();
            data.cards = [];
        });
        watch(() => config.col, () => {
            getDoMInfo();
            data.select.clear();
            data.cards = [];
        });
        
        const selectLength = computed(() => {
            let length = 0;
            data.select.forEach((item) => {
                length += item.length;
            })
            return length;
        });
        
        const defaultIcons = ['盛', '洁', '节', '日', '快', '乐', '你', '爱', '你', '一', '生', '世'];
        const icons = computed(() => {
            return defaultIcons.slice(0, 2 * data.level);
        });
        
        const defaultOffsetValue = [7, -7, 20, -20, 25, -25, 33, -33, 40, -40];
        const defaultOffsetValueLength = defaultOffsetValue.length;
        
        const defaultRounds = [3, 6, 9, 3, 6, 3, 3, 6, 3];
        
        const init = () => {
            data.select.clear();
            for (const i in icons.value) {
                const rounds = defaultRounds[Math.floor(Math.random() * defaultRounds.length)];
                for (let k = 0; k < rounds; k++) {
                    createCardInfo(icons.value[i]);
                }
            }
            checkShading();
        }
        
        const createCardInfo = (icon) => {
            const offset = defaultOffsetValue[Math.floor(defaultOffsetValueLength * Math.random())];
            const row = Math.floor(Math.random() * config.row);
            const col = Math.floor(Math.random() * config.col);

            let x = col * config.base + offset;
            let y = row * config.base + offset;

            data.cards.push({
                id: randomCreateId(6),
                icon,
                x,
                y,
                not: true,
                status: 0,
                clear: false,
                display: false
            })
        }

        const checkShading = () => {
            const cards = data.cards;
            for (let i = 0; i < cards.length; i++) {
                const cur = cards[i];
                cur.not = true;
                if (cur.status !== 0 || cur.display) continue;
                const {
                    x: x1,
                    y: y1
                } = cur;
                const x2 = x1 + config.base,
                    y2 = y1 + config.base;

                for (let j = i + 1; j < cards.length; j++) {
                    const compare = cards[j];
                    if (compare.status !== 0 || compare.display) continue;
                    const {
                        x,
                        y
                    } = compare;
                    if (!(y + config.base <= y1 || y >= y2 || x + config.base <= x1 || x >= x2)) {
                        cur.not = false;
                        break;
                    }
                }
            }
        }

        const handleStart = () => {
            init();
        }
        
        const handleReset = () => {
            data.cards.length = 0;
            data.select.clear();
            init();
        }
        
        const handleSwitch = (type) => {
            if (type === 'prev') {
                if (data.level === 1) {
                    window.alert('已经是第一关了！');
                    return;
                }
                data.level--;
            } else {
                if (data.level === defaultIcons.length) {
                    window.alert('已经是最后一关了！');
                    return;
                }
                data.level++;
            }
        }

        const clickCard = async (item, index) => {
            if (item.status === 1) return;

            const length = selectLength.value;
            const {
                selectMaxLength
            } = config;
            if (item.not && length < selectMaxLength) {
                const cards = data.cards;
                const currentCard = cards[index];
                currentCard.status = 1;
                await refreshCardPosition(currentCard);
                checkShading();
            };
            setTimeout(() => {
                if (selectLength.value >= config.selectMaxLength) {
                    alert('游戏失败，重新开始吧！');
                    handleReset();
                }
            }, config.animationTime);

        }
        const refreshCardPosition = (item) => {
            const {
                x,
                y
            } = data.cardSlotInfo;
            const {
                top,
                left
            } = data.containerInfo;

            if (item) {
                const cards = data.select.get(item.icon);
                if (cards) {
                    cards.push(item);
                    checkSelectQueue(cards);
                } else {
                    data.select.set(item.icon, [item]);
                }
            }
            let index = 0;
            const poor = (x < left) ? -(left - x) : (x - left);
            data.select.forEach((item) => {
                item.forEach((card) => {
                    card.x = index * config.base + poor + config.base / 2 + index * 6;
                    card.y = y - top + 12;
                    index++;
                });
            });
        }
        
        const checkSelectQueue = (cards) => {
            if (cards.length === config.maxCount) {
                cards.forEach((item) => {
                    item.clear = true;
                })

                setTimeout(() => {
                    data.select.delete(cards[0].icon);
                    cards.forEach((item) => {
                        item.display = true;
                    })
                }, config.animationTime - 100);

                setTimeout(() => {
                    refreshCardPosition();
                    const hasCards = data.cards.filter((item) => !item.display);
                    const level = data.level + 1;
                    if (!hasCards.length && level < config.maxLevel) {
                        alert(`通关啦, 开始第${level}关`);
                        data.level++;
                    }
                    if (!hasCards.length && level >= config.maxLevel) {
                        {
                            alert('恭喜游戏通关！方块嫌多，爱你永不嫌多！');
                            data.level = 1;
                        }
                    }
                }, config.animationTime + 100);
            }
        }

        const dataRefs = toRefs(data);
        return {
            ...dataRefs,
            config,
            handleStart,
            setContainerStyle,
            setCardStyle,
            setAnimation,
            handleSwitch,
            handleReset,
            clickCard
        }
    }
}
Vue.createApp(App).mount('#app');