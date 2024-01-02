/**
 * Live Update Macros Documentation
 *
 * Macros:
 * <<live>> / <<l>> / <<lh>>:
 *   - Re-evaluates and updates the expression whenever the associated variable changes.
 *   - <<lh>> is identical to <<live>>, but encodes HTML characters.
 *   - Syntax mirrors the <<print>> macro.
 *
 * <<liveblock>> / <<lb>>:
 *   - A container macro for sections of code that need live updates.
 *   - Can re-render larger code blocks dynamically.
 *   - Use <<update>> within the block to refresh its content.
 *
 * <<update>> / <<upd>>:
 *   - Triggers a synthetic event (:liveupdate) to refresh live displays.
 *   - Use after changing a variable to update <<live>> or <<liveblock>> displays.
 *
 * Usage Example:
 *   <<set $score to 0>>
 *   Current score: <<live $score>>
 *   <<button "Increase Score">>
 *     <<set $score++>>
 *     <<update>>
 *   <</button>>
 *
 *   <<liveblock>>
 *     <<if $score >= 10>>
 *       You have a high score!
 *     <<else>>
 *       Keep trying to increase your score.
 *     <</if>>
 *   <</liveblock>>
 *
 * Triggering Updates from JavaScript:
 *   - To trigger an update from JavaScript, dispatch the :liveupdate event:
 *     `$(document).trigger(":liveupdate");`
 */


(function () {
	"use strict";

	$(document).on(":liveupdate", function () {
		$(".macro-live").trigger(":liveupdateinternal");
	});

	Macro.add(['update', 'upd'], {
		handler: function handler() {
			$(document).trigger(":liveupdate");
		}
	});

	Macro.add(['live', 'l', 'lh'], {
		skipArgs: true,
		handler: function handler() {
			if (this.args.full.length === 0) {
				return this.error('no expression specified');
			}
			try {
				var statement = this.args.full;
				var result = toStringOrDefault(Scripting.evalJavaScript(statement), null);
				if (result !== null) {
					var lh = this.name === "lh";
					var $el = $("<span></span>").addClass("macro-live").wiki(lh ? Util.escape(result) : result).appendTo(this.output);
					$el.on(":liveupdateinternal", this.createShadowWrapper(function (ev) {
						var out = toStringOrDefault(Scripting.evalJavaScript(statement), null);
						$el.empty().wiki(lh ? Util.escape(out) : out);
					}));
				}
			} catch (ex) {
				return this.error("bad evaluation: " + (_typeof(ex) === 'object' ? ex.message : ex));
			}
		}
	});

	Macro.add(['liveblock', 'lb'], {
		tags: null,
		handler: function handler() {
			try {
				var content = this.payload[0].contents.trim();
				if (content) {
					var $el = $("<span></span>").addClass("macro-live macro-live-block").wiki(content).appendTo(this.output);
					$el.on(":liveupdateinternal", this.createShadowWrapper(function (ev) {
						$el.empty().wiki(content);
					}));
				}
			} catch (ex) {
				return this.error("bad evaluation: " + (_typeof(ex) === 'object' ? ex.message : ex));
			}
		}
	});
})();