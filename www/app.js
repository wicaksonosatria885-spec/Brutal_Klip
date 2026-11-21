ctx.fillStyle = "#09080c";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;

            /* 1. Latar belakang: VT 9:16 penuh, dipergelap lebih pekat (tanpa blur) tapi tetap tampak */
            const bgScale = Math.max(canvas.width / vw, canvas.height / vh);
            const bgW = vw * bgScale;
            const bgH = vh * bgScale;
            ctx.drawImage(video, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);

            ctx.fillStyle = "rgba(5, 4, 9, 0.78)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            /* 2. VT utama tepat di tengah: rasio YouTube (16:9), penuh kiri-kanan tanpa spasi & tanpa lengkung */
            const ytH = Math.round((canvas.width * 9) / 16);
            const ytY = Math.round((canvas.height - ytH) / 2);
            ctx.fillStyle = "#0b0a0e";
            ctx.fillRect(0, ytY, canvas.width, ytH);
            ctx.drawImage(video, 0, ytY, canvas.width, ytH);

            /* 3. WM diturunkan agar aman dari kolom pencarian TikTok */
            ctx.save();
            ctx.globalAlpha = styleOpts.wmClarity === "faded" ? 0.52 : 1;
            const wmY = styleOpts.wmPos === "bottom-center" ? canvas.height - 335 : 148;
            if (styleOpts.wmBgStyle && styleOpts.wmBgStyle !== "transparent") {
              ctx.fillStyle = styleOpts.wmBgStyle;
              if (styleOpts.wmPos === "top-left") {
                ctx.fillRect(46, wmY - 34, 230, 48);
              } else if (styleOpts.wmPos === "bottom-center") {
                ctx.fillRect(canvas.width / 2 - 125, wmY - 34, 250, 48);
              } else {
                ctx.fillRect(canvas.width - 276, wmY - 34, 230, 48);
              }
            }
            ctx.fillStyle = styleOpts.wmColor || "#ffffff";
            ctx.font = `bold ${styleOpts.wmSizePx || 21}px system-ui, sans-serif`;
            if (styleOpts.wmPos === "top-left") {
              ctx.textAlign = "left";
              if (wmLogoImgEl && wmLogoImgEl.complete && wmLogoImgEl.naturalWidth > 0) {
                ctx.drawImage(wmLogoImgEl, 56, wmY - 22, 26, 26);
                ctx.fillText(wmStr, 90, wmY);
              } else {
                ctx.fillText(wmStr, 56, wmY);
              }
            } else if (styleOpts.wmPos === "bottom-center") {
              ctx.textAlign = "center";
              ctx.fillText(wmStr, canvas.width / 2, wmY);
            } else {
              ctx.textAlign = "right";
              ctx.fillText(wmStr, canvas.width - 56, wmY);
            }
            ctx.restore();

            /* 4. HOOK turun mengikuti WM dengan jarak tetap pas ke WM dan jarak aman ke VT utama */
            const hookDur = Math.max(2, (clip.hookEndSec || startSec + 4) - (clip.hookStartSec || startSec));
            if (elapsed <= hookDur) {
              const hx = 56;
              const hw = canvas.width - 112;
              const hy = Math.max(216, ytY - 134);
              if (styleOpts.hookBgStyle && styleOpts.hookBgStyle !== "transparent") {
                ctx.fillStyle = styleOpts.hookBgStyle;
                ctx.fillRect(hx, hy, hw, 82);
              }
              ctx.fillStyle = styleOpts.hookColor || "#ffffff";
              ctx.font = `bold ${styleOpts.hookSizePx || 32}px system-ui, sans-serif`;
              if (styleOpts.hookAlign === "left") {
                ctx.textAlign = "left";
                ctx.fillText(hookStr.slice(0, 38), hx + 18, hy + 52);
              } else if (styleOpts.hookAlign === "right") {
                ctx.textAlign = "right";
                ctx.fillText(hookStr.slice(0, 38), hx + hw - 18, hy + 52);
              } else {
                ctx.textAlign = "center";
                ctx.fillText(hookStr.slice(0, 38), canvas.width / 2, hy + 52);
              }
            }

            /* 5. CC di bawah VT utama dengan jarak aman */
            if (ccEnabled && ccStr) {
              const cx = 56;
              const cw = canvas.width - 196;
              const cy = Math.min(canvas.height - 320, ytY + ytH + 46);
              if (styleOpts.ccBgStyle && styleOpts.ccBgStyle !== "transparent") {
                ctx.fillStyle = styleOpts.ccBgStyle;
                ctx.fillRect(cx, cy, cw, 76);
              }
              ctx.fillStyle = styleOpts.ccColor || "#fef08a";
              ctx.font = `600 ${styleOpts.ccSizePx || 25}px system-ui, sans-serif`;
              if (styleOpts.ccAlign === "left") {
                ctx.textAlign = "left";
                ctx.fillText(ccStr.slice(0, 48), cx + 16, cy + 47);
              } else if (styleOpts.ccAlign === "right") {
                ctx.textAlign = "right";
                ctx.fillText(ccStr.slice(0, 48), cx + cw - 16, cy + 47);
              } else {
                ctx.textAlign = "center";
                ctx.fillText(ccStr.slice(0, 48), cx + cw / 2, cy + 47);
              }
            }
