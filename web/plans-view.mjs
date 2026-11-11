import bank from './bank.mjs';
import { recommend } from './recommendation.mjs';
import { snapshot } from './entries.mjs';
import { messages } from './messages.mjs';
import { byId, element, button, notice } from './dom.mjs';

export function bindRecommendations({ getEntries, getDate, getSlot, commit }) {
  const form = byId('recommend');
  form.addEventListener('input', () => byId('plans').replaceChildren());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const date = getDate();
    const slot = getSlot();
    const target = byId('target').valueAsNumber;
    const plans = recommend(bank, getEntries(), {
      date,
      target,
      maxMinutes: byId('limit').valueAsNumber,
      lowImpact: byId('impact').checked,
    });
    byId('plans').replaceChildren(
      ...plans.map((plan, index) => {
        const block = element('article', undefined, 'plan');
        const title = index === 0 ? messages.firstChoice : messages.alternative({ number: index });
        const repeats = plan.repeats
          ? messages.repeated({ count: plan.repeats })
          : messages.noRepeats;
        block.append(
          element('h2', `${title} · ${plan.kcal} ${messages.calories}`),
          element(
            'p',
            messages.planSummary({
              minutes: plan.minutes,
              gap: Math.abs(plan.kcal - target),
              repeats,
            }),
          ),
        );
        if (plan.overloaded) block.append(element('small', messages.recentLoadWarning));
        const list = element('ol');
        list.append(
          ...plan.items.map((routine) => element('li', `${routine.name} · ${routine.minutes} min`)),
        );
        block.append(
          list,
          button(
            messages.recordPlan,
            () => {
              if (
                !confirm(
                  messages.recordPlanConfirm({
                    count: plan.items.length,
                    date,
                    slot: messages.slots[slot],
                  }),
                )
              )
                return;
              if (
                commit([
                  ...getEntries(),
                  ...plan.items.map((routine) => snapshot(routine, date, slot, 1)),
                ])
              )
                notice(messages.planSaved);
            },
            'primary',
          ),
        );
        return block;
      }),
    );
    if (!plans.length) byId('plans').append(element('p', messages.noPlans, 'empty'));
    else byId('plans').append(element('small', messages.rankingExplanation));
  });
}
