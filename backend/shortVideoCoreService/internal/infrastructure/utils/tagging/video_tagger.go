package tagging

import (
	"regexp"
	"strings"
)

// VideoTagger 视频标签提取器
type VideoTagger struct {
	// 预定义的关键词到标签的映射
	keywordMapping map[string][]string
}

// NewVideoTagger 创建视频标签提取器
func NewVideoTagger() *VideoTagger {
	return &VideoTagger{
		keywordMapping: getDefaultKeywordMapping(),
	}
}

// ExtractTags 从视频标题和描述中提取标签
func (vt *VideoTagger) ExtractTags(title, description string) []string {
	tags := make(map[string]bool)

	// 合并标题和描述
	content := strings.ToLower(title + " " + description)

	// 基于关键词映射提取标签
	for keyword, keywordTags := range vt.keywordMapping {
		if strings.Contains(content, keyword) {
			for _, tag := range keywordTags {
				tags[tag] = true
			}
		}
	}

	// 提取话题标签 #tag
	hashtagRegex := regexp.MustCompile(`#([a-zA-Z0-9\u4e00-\u9fa5]+)`)
	hashtags := hashtagRegex.FindAllStringSubmatch(content, -1)
	for _, match := range hashtags {
		if len(match) > 1 {
			tags[match[1]] = true
		}
	}

	// 转换为切片
	result := make([]string, 0, len(tags))
	for tag := range tags {
		result = append(result, tag)
	}

	// 如果没有提取到标签，返回默认标签
	if len(result) == 0 {
		result = append(result, "general")
	}

	return result
}

// getDefaultKeywordMapping 获取默认的关键词到标签映射
func getDefaultKeywordMapping() map[string][]string {
	return map[string][]string{
		// 娱乐类
		"搞笑": {"entertainment", "funny", "comedy"},
		"幽默": {"entertainment", "funny", "humor"},
		"段子": {"entertainment", "funny", "joke"},
		"相声": {"entertainment", "comedy", "crosstalk"},
		"小品": {"entertainment", "comedy", "sketch"},

		// 音乐类
		"音乐": {"music", "entertainment"},
		"唱歌": {"music", "singing", "entertainment"},
		"歌曲": {"music", "song", "entertainment"},
		"乐器": {"music", "instrument"},
		"钢琴": {"music", "piano"},
		"吉他": {"music", "guitar"},
		"舞蹈": {"music", "dance", "entertainment"},

		// 美食类
		"美食": {"food", "cooking", "lifestyle"},
		"做饭": {"food", "cooking", "lifestyle"},
		"烹饪": {"food", "cooking", "lifestyle"},
		"菜谱": {"food", "recipe", "cooking"},
		"甜品": {"food", "dessert", "sweet"},
		"火锅": {"food", "hotpot", "chinese"},

		// 运动类
		"运动": {"sports", "fitness", "health"},
		"健身": {"sports", "fitness", "health"},
		"跑步": {"sports", "running", "health"},
		"瑜伽": {"sports", "yoga", "health"},
		"篮球": {"sports", "basketball"},
		"足球": {"sports", "football"},

		// 科技类
		"科技":   {"technology", "tech"},
		"手机":   {"technology", "mobile", "phone"},
		"电脑":   {"technology", "computer"},
		"编程":   {"technology", "programming", "coding"},
		"AI":   {"technology", "ai", "artificial-intelligence"},
		"人工智能": {"technology", "ai", "artificial-intelligence"},

		// 教育类
		"教育": {"education", "learning"},
		"学习": {"education", "learning"},
		"知识": {"education", "knowledge"},
		"英语": {"education", "english", "language"},
		"数学": {"education", "math"},
		"历史": {"education", "history"},

		// 生活类
		"生活": {"lifestyle", "daily"},
		"日常": {"lifestyle", "daily"},
		"穿搭": {"lifestyle", "fashion", "outfit"},
		"化妆": {"lifestyle", "makeup", "beauty"},
		"护肤": {"lifestyle", "skincare", "beauty"},
		"旅行": {"lifestyle", "travel"},
		"旅游": {"lifestyle", "travel"},

		// 游戏类
		"游戏":   {"gaming", "entertainment"},
		"手游":   {"gaming", "mobile-game", "entertainment"},
		"电竞":   {"gaming", "esports", "entertainment"},
		"王者荣耀": {"gaming", "mobile-game", "moba"},
		"原神":   {"gaming", "mobile-game", "rpg"},

		// 情感类
		"爱情": {"emotion", "love", "relationship"},
		"恋爱": {"emotion", "love", "relationship"},
		"分手": {"emotion", "breakup", "relationship"},
		"友情": {"emotion", "friendship"},
		"家庭": {"emotion", "family"},

		// 动物类
		"宠物": {"pet", "animal", "lifestyle"},
		"狗":  {"pet", "dog", "animal"},
		"猫":  {"pet", "cat", "animal"},
		"动物": {"animal", "nature"},

		// 时尚美妆
		"时尚": {"fashion", "style", "lifestyle"},
		"美妆": {"beauty", "makeup", "fashion"},
		"服装": {"fashion", "clothing", "style"},
		"潮流": {"fashion", "trend", "style"},
	}
}
