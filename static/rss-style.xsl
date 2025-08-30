<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes" />

    <xsl:template match="/rss">
        <html>
            <head>
                <meta charset="UTF-8" />
                <title><xsl:value-of select="channel/title" /> - RSS</title>
                <style>
                    body {
                        max-width: 700px;
                        margin: 0 auto;
                        padding: 2rem 1rem;
                        color: #333;
                    }

                    h1 {
                        text-align: center;
                        margin-bottom: 1rem;
                    }

                    .rss-notice {
                        text-align: center;
                        margin-bottom: 2rem;
                    }

                    .item {
                        border-bottom: 1px solid #eee;
                        padding: 1rem 0;
                    }

                    .item h2 {
                        font-size: 1.1rem;
                        margin-bottom: 0.5rem;
                    }

                    .item a {
                        color: #0059ff;
                        text-decoration: none;
                        transition: color 0.3s ease;
                    }

                    .item a:hover {
                        text-decoration: underline;
                        text-underline-offset: 4px;
                        text-decoration-thickness: 2px;
                    }

                    .meta {
                        color: #666;
                        font-size: 0.9rem;
                        margin-bottom: 0.5rem;
                    }

                    .description {
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                </style>
            </head>
            <body>
                <h1>
                    <xsl:value-of select="channel/title" />
                </h1>

                <div class="rss-notice">
                    這是標準RSS格式，歡迎使用RSS閱讀器訂閱
                </div>

                <xsl:for-each select="channel/item">
                    <div class="item">
                        <h2>
                            <a href="{link}">
                                <xsl:value-of select="title" />
                            </a>
                        </h2>

                        <div class="meta">
                            <xsl:value-of select="substring(pubDate,1,10)" />
                            <br />
                            <xsl:value-of select="link" />
                        </div>


                        <div class="description">
                            <xsl:value-of select="description" disable-output-escaping="yes" />
                        </div>
                    </div>
                </xsl:for-each>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
