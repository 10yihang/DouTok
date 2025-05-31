package gorseadapter

// Config Gorse配置
type Config struct {
	Endpoint string `yaml:"endpoint" json:"endpoint"`
	ApiKey   string `yaml:"api_key" json:"api_key"`
}
